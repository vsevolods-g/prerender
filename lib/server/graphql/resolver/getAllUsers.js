const { MongoDBClient } = require('../../mongo');
const { ObjectId } = require('mongodb');

const getAllUsers = async (_, args, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const usersCollection = mongo.db.collection('users');
        const organizationsCollection = mongo.db.collection('organizations');

        const users = await usersCollection.find({}).toArray();

        const usersWithOrgNames = await Promise.all(
            users.map(async (user) => {
                let organizationNames = [];
                if (user.organizationIds && user.organizationIds.length > 0) {
                    const organizationIds = user.organizationIds.map(
                        (id) => new ObjectId(id)
                    );
                    const organizations = await organizationsCollection
                        .find({
                            _id: { $in: organizationIds },
                        })
                        .toArray();
                    organizationNames = organizations.map((org) => org.name);
                }

                return {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    isActive: user.isActive,
                    organizationIds: user.organizationIds || [],
                    organizationNames:
                        organizationNames.length > 0
                            ? organizationNames
                            : ['none'],
                };
            })
        );

        return {
            success: true,
            users: usersWithOrgNames,
        };
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        return {
            success: false,
            message: error.message,
            users: [],
        };
    }
};

module.exports = getAllUsers;
