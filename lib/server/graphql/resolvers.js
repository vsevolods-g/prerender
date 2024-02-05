const {
    getCachePages,
    getTotalCachePagesCount,
    getCachePageContent,
} = require('./resolver/getCachedPages');
const { getUniqueDomains } = require('./resolver/getUniqueDomains');
const authenticateWithGoogle = require('./resolver/authenticateWithGoogle');
const fetchAndCachePage = require('./resolver/fetchAndCachePage');
const { deleteCachedPage } = require('./resolver/deleteCachedPage');
const reCachePage = require('./resolver/reCachePage');
const associateUserWithOrganization = require('./resolver/associateUserWithOrganization');
const getUser = require('./resolver/getUser');
const getAllUsers = require('./resolver/getAllUsers');
const getAllOrganizations = require('./resolver/getAllOrganizations');
const createOrganization = require('./resolver/createOrganization');
const removeUsersFromOrganization = require('./resolver/removeUsersFromOrganization');
const addDomainsToOrganizations = require('./resolver/addDomainsToOrganizationsaddDomainsToOrganizations');
const {
    getDomainsForOrganizations,
} = require('./resolver/getDomainsForOrganizations');
const deleteOrganization = require('./resolver/deleteOrganization');
const activateUser = require('./resolver/activateUser');
const deactivateUser = require('./resolver/deactivateUser');
const checkIsActive = require('./resolver/checkIsActive');
const changeUserRole = require('./resolver/changeUserRole');

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
        getUser: authenticated(getUser),
        getAllUsers: authenticated(getAllUsers),
        getAllOrganizations: authenticated(getAllOrganizations),
        getCachePageContent: authenticated(getCachePageContent),
        getDomainsForOrganizations: authenticated(getDomainsForOrganizations),
        checkIsActive: checkIsActive,
    },
    Mutation: {
        authenticateWithGoogle,
        deleteCachedPage: authenticated(deleteCachedPage),
        fetchAndCachePage: authenticated(fetchAndCachePage),
        reCachePage: authenticated(reCachePage),
        associateUserWithOrganization: authenticated(
            associateUserWithOrganization
        ),
        createOrganization: authenticated(createOrganization),
        removeUsersFromOrganization: authenticated(removeUsersFromOrganization),
        addDomainsToOrganizations: authenticated(addDomainsToOrganizations),
        deleteOrganization: authenticated(deleteOrganization),
        activateUser: authenticated(activateUser),
        deactivateUser: authenticated(deactivateUser),
        changeUserRole: authenticated(changeUserRole),
    },
};

module.exports = { resolvers };
