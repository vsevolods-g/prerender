const { MongoDBClient } = require('../../mongo');

const deleteCachedPage = async (_, { url }, context) => {
  if (!context || !context.organizationId) {
    throw new Error('Not Authenticated');
  }

  const organizationId = context.organizationId;
  const mongoDBClient = new MongoDBClient();
  await mongoDBClient.connect();

  try {
    const result = await mongoDBClient.deleteCache(url, organizationId);
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
