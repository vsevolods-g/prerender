const {
  getCachePages,
  getTotalCachePagesCount,
} = require('./resolver/getCachedPages');
const { getUniqueDomains } = require('./resolver/getUniqueDomains');
const authenticateWithGoogle = require('./resolver/authenticateWithGoogle');
const fetchAndCachePage = require('./resolver/fetchAndCachePage');
const { deleteCachedPage } = require('./resolver/deleteCachedPage');

const authenticated = (resolverFunction) => {
  return (parent, args, context, info) => {
    if (!context || !context.userId) {
      throw new Error('Not Authenticated');
    }
    return resolverFunction(parent, args, context, info);
  };
};

const resolvers = {
  Query: {
    getCachePages: authenticated(getCachePages),
    getTotalCachePagesCount: authenticated(getTotalCachePagesCount),
    getUniqueDomains: authenticated(getUniqueDomains),
  },
  Mutation: {
    authenticateWithGoogle,
    deleteCachedPage: authenticated(deleteCachedPage),
    fetchAndCachePage: authenticated(fetchAndCachePage)
  },
};

module.exports = { resolvers };
