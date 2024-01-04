const { MongoDBClient } = require('../../mongo');

const deleteOrganization = async (_, { name }, context) => {
  if (!context || !context.userId || context.role !== 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const organizationsCollection = mongo.db.collection('organizations');
    const usersCollection = mongo.db.collection('users');

    const organization = await organizationsCollection.findOne({
      name: name,
    });
    if (!organization) {
      return {
        success: false,
        message: 'Organization not found',
      };
    }

    await organizationsCollection.deleteOne({ _id: organization._id });

    await usersCollection.updateMany(
      { organizationIds: organization._id },
      { $pull: { organizationIds: organization._id } },
    );

    return {
      success: true,
      message: 'Organization deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = deleteOrganization;
