const { MongoDBClient } = require('../../mongo');
const { ObjectId } = require('mongodb');

const getUser = async (_, args, context) => {
  if (!context || !context.userId) {
    throw new Error('Not Authenticated');
  }

  const userId = new ObjectId(context.userId);

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: {
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        organizationId: user.organizationId
          ? user.organizationId.toString()
          : null,
      },
    };
  } catch (error) {
    console.error('Error in getUser:', error);
    return {
      success: false,
      message: error.message,
      user: null,
    };
  }
};

module.exports = getUser;
