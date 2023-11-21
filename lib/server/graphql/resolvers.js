const { getCachePages } = require('./resolver/getCachedPages');
const { createNewAccount } = require('./resolver/createNewAccount');

const resolvers = {
    Query: {
        getCachePages,
        createNewAccount
    }
};

module.exports = { resolvers };
