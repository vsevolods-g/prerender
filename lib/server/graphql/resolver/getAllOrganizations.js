const { MongoDBClient } = require('../../mongo');

const getAllOrganizations = async (_, args, context) => {
  if (!context || !context.userId || !context.role === 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const organizationsCollection = mongo.db.collection('organizations');

    const organizations = await organizationsCollection.find({}).toArray();

    return organizations.map((org) => ({
      id: org._id.toString(),
      name: org.name,
    }));
  } catch (error) {
    console.error('Error in getAllOrganizations:', error);
    return [];
  }
};

module.exports = getAllOrganizations;
