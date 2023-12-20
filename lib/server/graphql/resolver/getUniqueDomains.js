const { MongoDBClient } = require('../../mongo');

const getUniqueDomains = async (parent, args, context) => {
  if (!context || !context.userId) {
    throw new Error('Not Authenticated');
  }

  const userId = context.userId;
  const mongo = new MongoDBClient();
  await mongo.connect();

  return await mongo.getUniqueDomains(userId);
};

module.exports = { getUniqueDomains };
