const { MongoDBClient } = require('../../mongo');
const { ObjectId } = require('mongodb');

const getUser = async (_, args, context) => {
    if (!context || !context.userId) {
        throw new Error('Not Authenticated');
    }

    const userId = new ObjectId(context.userId);

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const usersCollection = mongo.db.collection('users');
        const organizationsCollection = mongo.db.collection('organizations');

        const user = await usersCollection.findOne({ _id: userId });
        if (!user) {
            throw new Error('User not found');
        }

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
            success: true,
            user: {
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
                isActive: user.isActive,
                organizationIds: user.organizationIds || [],
                organizationNames: organizationNames,
            },
        };
    } catch (error) {
        console.error('Error in getUser:', error);
        return {
            success: false,
            message: error.message,
            user: null,
        };
    }
};

module.exports = getUser;
