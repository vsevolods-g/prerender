const { MongoDBClient } = require('../../mongo');

const deleteCachedPage = async (_, { url }, context) => {
  if (
    !context ||
    !context.organizationIds ||
    context.organizationIds.length === 0
  ) {
    throw new Error('Not Authenticated');
  }

  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();

  try {
    const result = await mongoDBClient.deleteCache(url);
    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Cache page not found or already deleted.',
      };
    }
    return { success: true, message: 'Cache page successfully deleted.' };
  } catch (error) {
    console.error(`Error in deleteCachedPage: ${error}`);
    return {
      success: false,
      message: 'Error occurred while deleting cache page.',
    };
  }
};

module.exports = { deleteCachedPage };
