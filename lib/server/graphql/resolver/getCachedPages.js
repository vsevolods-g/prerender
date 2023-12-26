const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, context) => {
  if (!context || !context.organizationId) {
    throw new Error('Not Authenticated');
  }

  const organizationId = context.organizationId;
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
    organizationId,
  );

  return result;
};

const getCachePageContent = async (parent, args, context) => {
  if (!context || !context.organizationId) {
    throw new Error('Not Authenticated');
  }

  const { key } = args;
  const organizationId = context.organizationId;

  const mongo = new MongoDBClient();
  await mongo.connect();

  const content = await mongo.getCachePageContent(key, organizationId);

  return { status: 200, content };
};

const getTotalCachePagesCount = async (parent, args, context) => {
  if (!context || !context.organizationId) {
    throw new Error('Not Authenticated');
  }

  const organizationId = context.organizationId;
  const mongo = new MongoDBClient();
  await mongo.connect();

  const count = await mongo.getTotalCachePagesCount(organizationId);
  return count;
};

module.exports = {
  getCachePages,
  getTotalCachePagesCount,
  getCachePageContent,
};
