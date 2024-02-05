const { MongoDBClient } = require('../../mongo');

const createOrganization = async (_, { name }, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const organizationsCollection = mongo.db.collection('organizations');

        const existingOrg = await organizationsCollection.findOne({ name });
        if (existingOrg) {
            return {
                success: false,
                message: 'Organization already exists',
            };
        }
        await organizationsCollection.insertOne({ name });

        return {
            success: true,
            message: 'Organization created successfully',
        };
    } catch (error) {
        console.error('Error in createOrganization:', error);
        return {
            success: false,
            message: error.message,
        };
    }
};

module.exports = createOrganization;
