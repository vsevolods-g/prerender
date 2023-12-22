const { MongoDBClient } = require('../../mongo');

const associateUsersWithOrganization = async (
  _,
  { userEmails, organizationName },
  context,
) => {
  if (!context || !context.userId || context.role !== 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');
    const organizationsCollection = mongo.db.collection('organizations');

    const organization = await organizationsCollection.findOne({
      name: organizationName,
    });

    if (!organization) {
      return {
        success: false,
        message: 'Organization not found.',
      };
    }

    await usersCollection.updateMany(
      { email: { $in: userEmails } },
      { $set: { organizationId: organization._id } },
    );

    return {
      success: true,
      message: 'Users associated with organization successfully',
    };
  } catch (error) {
    console.error('Error in associateUserWithOrganization:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = associateUsersWithOrganization;
