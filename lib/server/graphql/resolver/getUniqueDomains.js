const { MongoDBClient } = require('../../mongo');

const getUniqueDomains = async (parent, args, context) => {
  if (!context || !context.organizationId) {
    throw new Error('Not Authenticated');
  }

  const organizationId = context.organizationId;
  const mongo = new MongoDBClient();
  await mongo.connect();

  return await mongo.getUniqueDomains(organizationId);
};

module.exports = { getUniqueDomains };
