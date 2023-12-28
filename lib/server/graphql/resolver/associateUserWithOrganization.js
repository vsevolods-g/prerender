const { MongoDBClient } = require('../../mongo');

const associateUsersWithOrganization = async (
  _,
  { userEmails, organizationNames },
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

    // Find all organizations by their names
    const organizations = await organizationsCollection.find({
      name: { $in: organizationNames },
    }).toArray();

    if (organizations.length === 0) {
      return {
        success: false,
        message: 'No organizations found.',
      };
    }

    // Extract organization IDs
    const organizationIds = organizations.map(org => org._id);

    // Update users with the organization IDs
    await usersCollection.updateMany(
      { email: { $in: userEmails } },
      { $addToSet: { organizationIds: { $each: organizationIds } } }
    );

    return {
      success: true,
      message: 'Users associated with multiple organizations successfully',
    };
  } catch (error) {
    console.error('Error in associateUsersWithOrganization:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = associateUsersWithOrganization;

