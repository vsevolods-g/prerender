const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, context) => {
  if (!context || !context.userId) {
    throw new Error('Not Authenticated');
  }

  const userId = context.userId;
  const {
    pageSize,
    page,
    urlFilter,
    filterCondition,
    urlDomain,
    sortBy,
    sortDirection,
  } = args;

  const mongo = new MongoDBClient();
  await mongo.connect();

  const result = await mongo.getCachedPages(
    pageSize,
    page,
    urlFilter,
    filterCondition,
    urlDomain,
    sortBy,
    sortDirection,
    userId,
  );

  return result;
};

const getTotalCachePagesCount = async (parent, args, context) => {
  if (!context || !context.userId) {
    throw new Error('Not Authenticated');
  }

  const userId = context.userId;
  const mongo = new MongoDBClient();
  await mongo.connect();

  const count = await mongo.getTotalCachePagesCount(userId);
  return count;
};

module.exports = { getCachePages, getTotalCachePagesCount };
