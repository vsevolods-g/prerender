const express = require('express');
const { Chrome } = require('./lib/browser/chrome');
const { MongoDBClient } = require('./lib/server/mongo');
const { ApolloServer } = require('apollo-server-express');
const parseSitemap = require('./lib/utils/parse-sitemap');
const { typeDefs } = require('./lib/server/graphql/schema');
const { resolvers } = require('./lib/server/graphql/resolvers');

require('dotenv').config();

const app = express();
const port = process.env['EXPRESS_SERVER_PORT']; // Set the port number you want to use

let browser;
let mongo;

const checkCache = async (req, res, next) => {
    const { query: { url } } = req;

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
}

// Define a route
app.get('/', checkCache, async (req, res) => {
    const { query: { url }, headers: { 'user-agent': userAgent } } = req;

    browser.setUserAgent(userAgent);
    const page = await browser.openNewTab({ targetUrl: url });

    const status = browser.pagesStatusCode[url] || 200;
    const content = page.pageContent;

    try {
        await mongo.insertCache({ url, content, status });
    } catch(e) {
        console.log(e);
    }

    res.status(status).send(content);
});

app.get('/cache/delete', async (req, res) => {
    const { query: { url } } = req;

    try {
        const { deletedCount } = await mongo.deleteCache(url);

        if (!deletedCount) {
            res.status(404).send(`Cache for url: "${url}" doesn't exists.`)

            return;
        }

        res.status(200).send(`Cache for url: "${url}" deleted successfully.`)
    } catch(e) {
        res.status(500).send(`Error while deleting cache for url: ${url}`);
    }
});

app.get('/prerender/sitemap', async (req, res) => {
    const { query: { path }, headers: { 'user-agent': userAgent } } = req;

    browser.setUserAgent(userAgent);

    const parsedSitemap = await parseSitemap(path);

    const preparedPromises = parsedSitemap.reduce((acc, urlArray) => {
        const promisesArray = [];

        urlArray.map((url) => {
            promisesArray.push(() => getSiteMapUrl(url));
        })

        acc.push(promisesArray);

        return acc;
    }, [])


    for (const arr of preparedPromises) {
        await Promise.all(arr.map(fn => fn()));
    }


    res.status(200).send('Sitemap prerender finished');
});

async function getSiteMapUrl(url) {
    const page = await browser.openNewTab({ targetUrl: url });
    const status = browser.pagesStatusCode[url];
    const content = page.pageContent;

    await mongo.insertCache({ url, content, status });
}

async function startServer() {
    const apolloServer = new ApolloServer({ typeDefs, resolvers });
    await apolloServer.start();

    apolloServer.applyMiddleware({ app, path: '/graphql' });
}

startServer();

// Start the server
app.listen(port, async () => {
    if (!browser) {
        browser = new Chrome();

        await browser.startBrowser();
        await browser.connectDevTools();
    }

    if (!mongo) {
        mongo = new MongoDBClient()

        await mongo.connect();
        await mongo.createTTLIndex();
    }

    console.log(`Server is running on port ${port}`);
});