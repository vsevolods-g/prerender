const { MongoDBClient } = require('../../mongo');

const addDomainsToOrganizations = async (_, { organizations }, context) => {
  // Ensure authentication and authorization
  if (!context || !context.userId || context.role !== 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const organizationsCollection = mongo.db.collection('organizations');


    await Promise.all(
      organizations.map(async ({ orgName, domains }) => {
        await organizationsCollection.updateOne(
          { name: orgName },
          { $addToSet: { domains: { $each: domains } } },
        );
      }),
    );

    return {
      success: true,
      message: 'Domains added to organizations successfully',
    };
  } catch (error) {
    console.error('Error in addDomainsToOrganizations:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = addDomainsToOrganizations;
