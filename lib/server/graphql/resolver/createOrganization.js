const { MongoDBClient } = require('../../mongo');
const { ObjectId } = require('mongodb');

const createOrganization = async (_, { name }, context) => {
  if (!context || !context.userId || !context.role === 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const organizationsCollection = mongo.db.collection('organizations');

    const existingOrg = await organizationsCollection.findOne({ name });
    if (existingOrg) {
      return {
        success: false,
        message: 'Organization already exists',
        organization: null,
      };
    }

    const result = await organizationsCollection.insertOne({ name });
    const newOrg = await organizationsCollection.findOne({ _id: result.insertedId });

    return {
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: newOrg._id.toString(),
        name: newOrg.name,
      },
    };
  } catch (error) {
    console.error('Error in createOrganization:', error);
    return {
      success: false,
      message: error.message,
      organization: null,
    };
  }
};

module.exports = createOrganization;
