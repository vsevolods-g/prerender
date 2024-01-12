const { MongoDBClient } = require('../../mongo');

const getQueueDetails = async (_, { page = 1, pageSize = 10 }, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();

  const skip = (page - 1) * pageSize;

  return await mongoDBClient.getQueueDetails(pageSize, skip);
};

module.exports = getQueueDetails;
