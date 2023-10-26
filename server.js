const express = require('express');
const { Chrome } = require('./lib/browser/chrome');
const app = express();
const port = 3000; // Set the port number you want to use
const { RedisClient } = require('./lib/server/redis');
const parseSitemap = require('./lib/utils/parse-sitemap');

require('dotenv').config();

let browser;
let redisClient;

const checkRedisCache = async (req, res, next) => {
    const { query: { url } } = req;

    if (!url) {
        res.send('Missing url param');

        return;
    }

    const cachedResult = await redisClient.getCachedPage(url) || false;

    if (cachedResult) {
        const { status, content } = JSON.parse(cachedResult);

        res.status(status).send(content);

        return;
    }

    next();
}

// Define a route
app.get('/', checkRedisCache, async (req, res) => {
    const { query: { url }, headers: { 'user-agent': userAgent } } = req;

    if (!url) {
        res.send('Missing url param');
        return;
    }

    browser.setUserAgent(userAgent);
    const page = await browser.openNewTab({ targetUrl: url });

    const status = browser.pagesStatusCode[url] || 200;
    const content = page.pageContent;

    try {
        await redisClient.cachePage(url, content, status);
    } catch(e) {
        console.log(e);
    }

    res.status(status).send(content);
});

app.get('/cache/delete', async (req, res) => {
    const { query: { url } } = req;

    const result = await redisClient.clearCacheForPage(url);

    if (result === 1) {
        res.status(200).send(`Cache for url: "${url}" deleted successfully.`)

        return;
    }

    if (result === 0) {
        res.status(404).send(`Cache for url: "${url}" doesn't exists.`)

        return;
    }

    res.status(200).send('test');
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


    res.status(200).send('test');
});

async function getSiteMapUrl(url) {
    console.log('sitemap prerender start: ', url);
    const page = await browser.openNewTab({ targetUrl: url });
    console.log('sitemap prerender finish: ', url)
    const status = browser.pagesStatusCode[url];
    const content = page.pageContent;

    await redisClient.cachePage(url, content, status);
}

// Start the server
app.listen(port, async () => {
    if (!redisClient) {
        redisClient = new RedisClient();

        await redisClient.init();
    }

    if (!browser) {
        browser = new Chrome();

        await browser.startBrowser();
        await browser.connectDevTools();
    }

    console.log(`Server is running on port ${port}`);
});