const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, contextValue, info) => {
    const { pageSize, page, domain } = args;

    const mongo = new MongoDBClient({url: 'mongodb://localhost:27017'})
    await mongo.connect();

    const result = await mongo.getCachedPages(pageSize, page, domain);

    return result
}

module.exports = { getCachePages };
