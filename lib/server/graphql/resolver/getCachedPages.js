const { getOrganizationIdsByUserId } = require('../../../utils/organziation');
const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  const organizationIds = await getOrganizationIdsByUserId(context.userId);

  if (!organizationIds || organizationIds.length === 0) {
    throw new Error('No associated organizations');
  }

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
    organizationIds,
  );

  return result;
};

const getCachePageContent = async (parent, args, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  const { key } = args;

  const mongo = new MongoDBClient();
  await mongo.connect();

  const content = await mongo.getCachePageContent(key);

  return { status: 200, content };
};

const getTotalCachePagesCount = async (parent, args, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  const {  urlFilter, filterCondition, urlDomain } = args;
  const organizationIds = await getOrganizationIdsByUserId(context.userId);

  if (!organizationIds || organizationIds.length === 0) {
    throw new Error('No associated organizations');
  }

  const mongo = new MongoDBClient();
  await mongo.connect();

  const totalPages = await mongo.getTotalCachePagesCount(
    urlFilter,
    filterCondition,
    urlDomain,
    organizationIds,
  );

  return totalPages;
};

module.exports = {
  getCachePages,
  getTotalCachePagesCount,
  getCachePageContent,
};
