const { recacheQueue } = require('../../../utils/recache-queue');
const { MongoDBClient } = require('../../mongo');

const reCachePage = async (_, { url }, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  await recacheQueue.add({ url, userAgent: context.userAgent });

  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();
  await mongoDBClient.updateRecacheTaskStatus({ url, status: 'queued' });

  return "Recaching task queued successfully";
};

module.exports = reCachePage;
