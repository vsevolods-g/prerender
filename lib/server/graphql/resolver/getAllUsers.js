const { MongoDBClient } = require('../../mongo');
const { ObjectId } = require('mongodb');

const getAllUsers = async (_, args, context) => {
  if (!context || !context.userId || !context.role === 'admin') {
    throw new Error('Not Authenticated');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');
    const organizationsCollection = mongo.db.collection('organizations');

    const users = await usersCollection.find({}).toArray();

    const usersWithOrgName = await Promise.all(
      users.map(async (user) => {
        let organizationName = null;
        if (user.organizationId) {
          const organization = await organizationsCollection.findOne({
            _id: new ObjectId(user.organizationId),
          });
          organizationName = organization ? organization.name : 'none';
        }

        return {
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: organizationName ? organizationName : 'none',
        };
      }),
    );

    return {
      success: true,
      users: usersWithOrgName,
    };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return {
      success: false,
      message: error.message,
      users: [],
    };
  }
};

module.exports = getAllUsers;
