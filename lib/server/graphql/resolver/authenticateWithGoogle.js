const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { MongoDBClient } = require('../../mongo');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ADMIN_EMAIL = 'salem.hatoum@scandiweb.com';

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

    let orgIDString = null;
    let isAdmin = false;
    if (user) {
      // Check if the user is the hardcoded admin
      if (user.email === ADMIN_EMAIL) {
        user.role = 'admin';
        isAdmin = true;
      }
      orgIDString = user.organizationId ? user.organizationId.toString() : null;
      console.log(orgIDString);
    } else {
      // Assign 'admin' role if the new user is the hardcoded admin
      isAdmin = googleUser.email === ADMIN_EMAIL;
      const newUser = {
        email: googleUser.email,
        name: profile.name,
        image: profile.image,
        role: isAdmin ? 'admin' : 'user',
        organizationId: null,
        isAdmin: isAdmin,
      };
      const result = await usersCollection.insertOne(newUser);
      user = await usersCollection.findOne({ _id: result.insertedId });
    }

    const jwtToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        organizationId: orgIDString,
        isAdmin: isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );

    const response = {
      success: true,
      message: 'User authenticated successfully',
      token: jwtToken,
      role: user.role,
      organizationId: orgIDString,
      isAdmin: isAdmin,
    };

    return response;
  } catch (error) {
    return {
      success: false,
      message: error.message,
      token: null,
      role: null,
      orgID: null,
      isAdmin: false,
    };
  }
};

module.exports = authenticateWithGoogle;
