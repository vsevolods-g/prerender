const { ObjectId } = require('mongodb');
const { MongoDBClient } = require('../../mongo');

const removeUsersFromOrganization = async (
    _,
    { userEmails, organizationNames },
    context
) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const usersCollection = mongo.db.collection('users');
        const organizationsCollection = mongo.db.collection('organizations');

        const orgData = await organizationsCollection
            .find({ name: { $in: organizationNames } })
            .toArray();

        const organizationIds = orgData.map((org) => new ObjectId(org._id));
        const organizationNamesToRemove = orgData.map((org) => org.name);

        await usersCollection.updateMany(
            { email: { $in: userEmails } },
            {
                $pull: {
                    organizationIds: { $in: organizationIds },
                    organizationNames: { $in: organizationNamesToRemove },
                },
            }
        );

        await usersCollection.find({ email: { $in: userEmails } }).toArray();

        return {
            success: true,
            message: 'Users removed from organization successfully',
        };
    } catch (error) {
        console.error('Error in removeUsersFromOrganization:', error);
        return {
            success: false,
            message: error.message,
        };
    }
};

module.exports = removeUsersFromOrganization;
