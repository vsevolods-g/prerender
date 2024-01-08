const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { MongoDBClient } = require('../../mongo');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ADMIN_EMAIL = 'aleksandrs.kondratjevs@scandiweb.com';

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

    // If isActive is undefined, set it to true
    if (user && user.isActive === undefined) {
      await usersCollection.updateOne(
        { email: user.email },
        { $set: { isActive: true } },
      );
      user.isActive = true;
    }

    if (user && !user.isActive) {
      return {
        success: false,
        message: 'Your account is deactivated. Please contact support.',
        token: null,
        role: null,
        organizationIds: null,
      };
    }

    const isAdmin =
      user?.email === ADMIN_EMAIL || googleUser.email === ADMIN_EMAIL;
    let orgIDStrings = user?.organizationIds?.map((id) => id.toString()) || [];

    if (!user) {
      const newUser = {
        email: googleUser.email,
        name: profile.name,
        image: profile.image,
        role: isAdmin ? 'admin' : 'user',
        organizationIds: orgIDStrings,
        isActive: true,
      };
      const result = await usersCollection.insertOne(newUser);
      user = await usersCollection.findOne({ _id: result.insertedId });
    } else if (isAdmin && user.role !== 'admin') {
      await usersCollection.updateOne(
        { email: user.email },
        { $set: { role: 'admin' } },
      );
    }

    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        organizationIds: orgIDStrings,
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );

    const response = {
      success: true,
      message: 'User authenticated successfully',
      token: jwtToken,
      role: user.role,
      organizationIds: orgIDStrings,
    };

    return response;
  } catch (error) {
    return {
      success: false,
      message: error.message,
      token: null,
      role: null,
      organizationIds: null,
    };
  }
};

module.exports = authenticateWithGoogle;
