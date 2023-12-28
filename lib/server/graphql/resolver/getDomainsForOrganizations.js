const { getOrganizationIdsByUserId } = require('../../../utils/organziation');
const { MongoDBClient } = require('../../mongo');

const getDomainsForOrganizations = async (parent, args, context) => {
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

  const mongo = new MongoDBClient();
  await mongo.connect();

  return await mongo.getDomainsForOrganizations(organizationIds);
};

module.exports = { getDomainsForOrganizations };
