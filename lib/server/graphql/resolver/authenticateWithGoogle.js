const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { MongoDBClient } = require('../../mongo');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

const authenticateWithGoogle = async (_, { token, profile }) => {
  try {
    const googleUser = await verifyGoogleToken(token);

    const mongo = new MongoDBClient();
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    let user = await usersCollection.findOne({ email: googleUser.email });

    if (!user) {
      const newUser = {
        email: googleUser.email,
        name: profile.name,
        image: profile.image,
      };
      const result = await usersCollection.insertOne(newUser);
      user = result.ops[0];
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });

    return {
      success: true,
      message: 'User authenticated successfully',
      token: jwtToken,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error.message,
      token: null,
    };
  }
};

module.exports = authenticateWithGoogle;
