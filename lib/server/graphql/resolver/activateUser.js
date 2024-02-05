const { MongoDBClient } = require('../../mongo');

const activateUser = async (_, { email }, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const usersCollection = mongo.db.collection('users');

        const result = await usersCollection.updateOne(
            { email: email },
            { $set: { isActive: true } }
        );

        if (result.matchedCount === 0) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        return {
            success: true,
            message: 'User activated successfully',
        };
    } catch (error) {
        console.error('Error in activateUser:', error);
        return {
            success: false,
            message: error.message,
        };
    }
};

module.exports = activateUser;
