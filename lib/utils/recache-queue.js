const Queue = require('bull');
const { MongoDBClient } = require('../server/mongo');
const { Chrome } = require('../browser/chrome');

const recacheQueue = new Queue('recache', 'redis://127.0.0.1:6379');

const processRecacheJob = async (job) => {
  const { url, userAgent } = job.data;
  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();

  try {
    await mongoDBClient.updateRecacheTaskStatus({ url, status: 'active' });
    const browser = new Chrome();
    browser.setUserAgent(userAgent);
    const page = await browser.openNewTab({ targetUrl: url });
    const status = browser.pagesStatusCode[url] || 200;
    const content = page.pageContent;

    await mongoDBClient.updateCache({ url, content, status });
    await mongoDBClient.updateRecacheTaskStatus({ url, status: 'completed' });
  } catch (error) {
    await mongoDBClient.updateRecacheTaskStatus({ url, status: 'failed' });
  }
};

module.exports = { recacheQueue, processRecacheJob };
