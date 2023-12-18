const { MongoDBClient } = require("../../mongo");

const getUniqueDomains = async () => {
    const mongo = new MongoDBClient();
    await mongo.connect();
    return await mongo.getUniqueDomains();
};

module.exports = { getUniqueDomains };
