const { getCachePages } = require('./resolver/getCachedPages');

const resolvers = {
    Query: {
        getCachePages
    }
};

module.exports = { resolvers };
