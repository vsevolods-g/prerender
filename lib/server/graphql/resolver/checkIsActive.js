const { MongoDBClient } = require('../../mongo');

const checkIsActive = async (_, { email }) => {
  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    const user = await usersCollection.findOne(
      { email },
      { projection: { isActive: 1 } },
    );

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        isActive: false,
      };
    }

    return {
      success: true,
      message: 'User status fetched successfully',
      isActive: user.isActive,
    };
  } catch (error) {
    console.error('Error in checkIsActive:', error);
    return {
      success: false,
      message: error.message,
      isActive: false,
    };
  }
};

module.exports = checkIsActive;
