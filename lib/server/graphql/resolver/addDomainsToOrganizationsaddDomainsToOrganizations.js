const { MongoDBClient } = require('../../mongo');

const addDomainsToOrganizations = async (_, { organizations }, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const organizationsCollection = mongo.db.collection('organizations');

        await Promise.all(
            organizations.map(async ({ orgName, domains }) => {
                // Set the domains field to the provided domains array
                await organizationsCollection.updateOne(
                    { name: orgName },
                    { $set: { domains: domains } }
                );
            })
        );

        return {
            success: true,
            message: 'Organizations updated successfully',
        };
    } catch (error) {
        console.error('Error in updateOrganizationsDomains:', error);
        return {
            success: false,
            message: error.message,
        };
    }
};

module.exports = addDomainsToOrganizations;
