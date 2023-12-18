const { MongoDBClient } = require('../../mongo');

const getCachePages = async (parent, args, contextValue, info) => {
    const { pageSize, page, urlFilter, filterCondition, urlDomain, sortBy, sortDirection } = args;

    const mongo = new MongoDBClient()
    await mongo.connect();

    const result = await mongo.getCachedPages(
        pageSize,
        page,
        urlFilter,
        filterCondition,
        urlDomain,
        sortBy,
        sortDirection
    );

    return result
}

const getTotalCachePagesCount = async () => {
    const mongo = new MongoDBClient();
    await mongo.connect();

    const count = await mongo.getTotalCachePagesCount(); 
    return count;
};

module.exports = { getCachePages, getTotalCachePagesCount };
