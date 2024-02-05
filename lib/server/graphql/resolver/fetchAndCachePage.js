const { Chrome } = require('../../../browser/chrome');
const { MongoDBClient } = require('../../mongo');

const fetchAndCachePage = async (_, { url }, context) => {
    if (!context || !context.userId) {
        throw new Error('Not Authenticated');
    }

    const userAgent = context.userAgent;

    const mongoDBClient = new MongoDBClient();
    await mongoDBClient.connect();

    const cache = await mongoDBClient.getCache(url);
    if (cache) {
        const { status, content } = cache;
        return { status, content };
    }

    // If not in cache, fetch and cache the content
    const browser = new Chrome();
    browser.setUserAgent(userAgent);
    const page = await browser.openNewTab({ targetUrl: url });
    const status = browser.pagesStatusCode[url] || 200;
    const content = page.pageContent;

    try {
        await mongoDBClient.insertCache({ url, content, status });
    } catch (e) {
        console.error(`Error in fetchAndCachePageResolver: ${e}`);
        throw new Error('Error fetching and caching page');
    }

    return { status, content };
};

module.exports = fetchAndCachePage;
