const express = require('express');
const { Chrome } = require('./lib/browser/chrome');
const { MongoDBClient } = require('./lib/server/mongo');
const { ApolloServer } = require('apollo-server-express');
// const parseSitemap = require('./lib/utils/parse-sitemap');
const { typeDefs } = require('./lib/server/graphql/schema');
const { resolvers } = require('./lib/server/graphql/resolvers');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
require('dotenv').config();
const Queue = require('bull');

const app = express();
const port = process.env['EXPRESS_SERVER_PORT']; // Set the port number you want to use

let browser;
let mongo;
let queues = [];

async function prerenderPage(url, isUpdateCache = false) {
    const page = await browser.openNewTab({ targetUrl: url });

    const status = browser.pagesStatusCode[url] || 200;
    const content = page.pageContent;

    try {
        await browser.deleteStatusCode(url);
    } catch (e) {
        console.log('Error on deleting status code from local variable: ', e);
    }

    try {
        if (isUpdateCache) {
            await mongo.updateCache({ url, content, status });
        } else {
            await mongo.insertCache({ url, content, status });
        }
    } catch (e) {
        console.log('Error on saving cache: ', e);
    }

    return { content, status };
}

// initScheduler
function initCacheCheckSchedule() {
    schedule.scheduleJob(process.env.SCHEDULE_FREQUENCE, checkExpiredDocuments);
}

async function checkExpiredDocuments() {
    try {
        const currentDateTime = new Date();
        // Check if cache will expire in next 6h, so we can recache it before
        currentDateTime.setHours(currentDateTime.getHours() + 24);
        const expiredDocuments = await mongo.collection
            .find({
                expirationTime: { $lt: currentDateTime },
                recacheStatus: { $ne: 'pending' },
                status: { $in: [200] }
            })
            .toArray();

        expiredDocuments.forEach(async ({ key: url }) => {
            await mongo.updateRecacheStatus('pending', url);
            let domainName = (new URL(url)).hostname.replace('www.', '');
            let queueIndex = queues.findIndex(element => element.name === domainName);

            if (queueIndex > -1) {
                await queues[queueIndex].add({ url });
            } else {
                queues.push(new Queue(domainName, 'redis://127.0.0.1:6379'));
                queues[queues.length - 1].process(50, processRecacheJob);
            }
        });
    } catch (error) {
        console.error('Error checking expired documents:', error);
    }
}

async function startServer() {
    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const { userId, role, organizationIds } =
                getUserDetailsFromRequest(req);
            const userAgent = req.headers['user-agent'];
            return { userId, role, organizationIds, userAgent };
        },
    });
    await apolloServer.start();

    apolloServer.applyMiddleware({ app, path: '/graphql' });
}

startServer();

const checkCache = async (req, res, next) => {
    const {
        query: { url },
    } = req;

    if (!url) {
        res.send('Missing url param');

        return;
    }

    const cache = await mongo.getCache(url);

    if (cache) {
        const { status, content } = cache;

        res.status(status).send(content);

        return;
    }

    next();
};

function getUserDetailsFromRequest(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.error('No token found in request');
        return { userId: null, role: null, organizationIds: [] };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            userId: decoded.userId || null,
            role: decoded.role || null,
            organizationIds: decoded.organizationIds || [],
        };
    } catch (error) {
        console.error('JWT verification error:', error);
        return { userId: null, role: null, organizationIds: [] };
    }
}

const processRecacheJob = async (job) => {
    const { url } = job.data;

    try {
        await prerenderPage(url, true);
    } catch (error) {
        console.log('Error while recaching page: ', error);
    }
};

app.get('/', checkCache, async (req, res) => {
    const {
        query: { url },
        headers: { 'user-agent': userAgent },
    } = req;

    browser.setUserAgent(userAgent);
    const { content, status } = await prerenderPage(url);

    res.status(status).send(content);
});

// app.get('/prerender/sitemap', async (req, res) => {
//     const {
//         query: { path },
//         headers: { 'user-agent': userAgent },
//     } = req;

//     browser.setUserAgent(userAgent);

//     const parsedSitemap = await parseSitemap(path);

//     const preparedPromises = parsedSitemap.reduce((acc, urlArray) => {
//         const promisesArray = [];

//         urlArray.map((url) => {
//             promisesArray.push(() => getSiteMapUrl(url));
//         });

//         acc.push(promisesArray);

//         return acc;
//     }, []);

//     for (const arr of preparedPromises) {
//         await Promise.all(arr.map((fn) => fn()));
//     }

//     res.status(200).send('Sitemap prerender finished');
// });

// async function getSiteMapUrl(url) {
//     const page = await browser.openNewTab({ targetUrl: url });
//     const status = browser.pagesStatusCode[url];
//     const content = page.pageContent;

//     await mongo.insertCache({ url, content, status });
// }

// Start the server
app.listen(port, async () => {
    if (!browser) {
        browser = new Chrome();

        await browser.startBrowser();
        await browser.connectDevTools();
    }

    if (!mongo) {
        mongo = new MongoDBClient();

        await mongo.connect();
        await mongo.createTTLIndex();
        initCacheCheckSchedule();
    }

    console.log(`Server is running on port ${port}`);
});
