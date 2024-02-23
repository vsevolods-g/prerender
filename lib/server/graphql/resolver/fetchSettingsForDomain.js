const { MongoDBClient } = require('../../mongo');

const fetchSettingsForDomain = async (_, {domain}, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const domainsCollection = mongo.db.collection('domains');

        return await domainsCollection.findOne({ domain });
    } catch (error) {
        console.error('Error in setting domain settings:', error);
        return {
            domain,
            values
        };
    }
};

module.exports = fetchSettingsForDomain;
