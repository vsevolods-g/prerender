const { MongoDBClient } = require('../server/mongo');

const getOrganizationIdsByUserId = async (userId) => {
    const mongoDBClient = new MongoDBClient();
    await mongoDBClient.connect();

    const user = await mongoDBClient.getUserById(userId);
    return user ? user.organizationIds : null;
};

module.exports = { getOrganizationIdsByUserId };
