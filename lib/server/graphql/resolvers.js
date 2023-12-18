const { getCachePages, getTotalCachePagesCount } = require('./resolver/getCachedPages');
const { createNewAccount } = require('./resolver/createNewAccount');
const { deleteCachedPage } = require('./resolver/deleteCachedPage');
const { getUniqueDomains } = require('./resolver/getUniqueDomains');

const resolvers = {
    Query: {
        getCachePages,
        createNewAccount,
        getTotalCachePagesCount,
        getUniqueDomains
    },
    Mutation: {
        deleteCachedPage
    }
};

module.exports = { resolvers };
