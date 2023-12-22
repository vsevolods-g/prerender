const { MongoDBClient } = require('../../mongo');

const removeUsersFromOrganization = async (
  _,
  { userEmails, organizationName },
  context,
) => {
  if (!context || !context.userId || !context.role === 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    await usersCollection.updateMany(
      { email: { $in: userEmails } },
      { $unset: { organizationId: '' } },
    );

    return {
      success: true,
      message: 'Users removed from organization successfully',
    };
  } catch (error) {
    console.error('Error in removeUsersFromOrganization:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = removeUsersFromOrganization;
