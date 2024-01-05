const { MongoDBClient } = require('../../mongo');

const changeUserRole = async (_, { email, newRole }, context) => {
  if (!context || !context.userId || context.role !== 'admin') {
    throw new Error('Not Authenticated or not authorized');
  }

  try {
    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    const result = await usersCollection.updateOne(
      { email: email },
      { $set: { role: newRole } },
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    return {
      success: true,
      message: 'User role updated successfully',
    };
  } catch (error) {
    console.error('Error in changeUserRole:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = changeUserRole;
