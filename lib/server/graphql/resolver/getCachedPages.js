const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, contextValue, info) => {
    const { pageSize, page, urlFilter, sortBy, sortDirection } = args;

    const mongo = new MongoDBClient()
    await mongo.connect();

    const result = await mongo.getCachedPages(
        pageSize,
        page,
        urlFilter,
        sortBy,
        sortDirection
    );

    return result
}

module.exports = { getCachePages };
