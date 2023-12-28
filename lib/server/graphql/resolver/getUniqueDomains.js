const { MongoDBClient } = require('../../mongo');

const getUniqueDomains = async (parent, args, context) => {
  if (!context || !context.userId || context.role !== 'admin') {
    throw new Error('Not Authenticated');
  }

  const mongo = new MongoDBClient();
  await mongo.connect();

  return await mongo.getUniqueDomains();
};

module.exports = { getUniqueDomains };
