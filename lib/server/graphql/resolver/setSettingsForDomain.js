const { MongoDBClient } = require('../../mongo');

const setSettingsForDomain = async (_, {domain, values}, context) => {
    if (!context || !context.userId || context.role !== 'admin') {
        throw new Error('Not Authenticated');
    }

    try {
        const mongo = new MongoDBClient();
        await mongo.connect();
        const domainsCollection = mongo.db.collection('domains');
        const domainExists = await domainsCollection.findOne({ domain });

        if (domainExists) {
            await domainsCollection.updateOne({domain: domainExists.domain}, {$set: { values: values }});
        } else {
            await domainsCollection.insertOne({ domain, values });
        }

        return {
            domain,
            values,
        };
    } catch (error) {
        console.error('Error in setting domain settings:', error);
        return {
            domain,
            values
        };
    }
};

module.exports = setSettingsForDomain;
