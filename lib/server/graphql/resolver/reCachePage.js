const { Chrome } = require('../../../browser/chrome');
const { MongoDBClient } = require('../../mongo');

const reCachePage = async (_, { url }, context) => {
  if (!context || !context.userId) {
    throw new Error('Not Authenticated');
  }

  const userId = context.userId;
  const userAgent = context.userAgent;

  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();

  // Fetch the new content of the page
  const browser = new Chrome();
  browser.setUserAgent(userAgent);
  const page = await browser.openNewTab({ targetUrl: url });
  const status = browser.pagesStatusCode[url] || 200;
  const content = page.pageContent;

  await mongoDBClient.updateCache({ url, content, status, userId });

  return { status, content };
};

module.exports = reCachePage;
