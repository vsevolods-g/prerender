const { MongoDBClient } = require('../../mongo');

const getAccessToken = async (parent, args, contextValue, info) => {
    const { email, password } = args;

    const mongo = new MongoDBClient()
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    const user = usersCollection.findOne({ email });

    if (!user) {
        return {
            message: `User doesn't exists`
        }
    }

    const {
        email: userEmail,
        password: userPassword
    } = user;

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
        return {
            message: `Password is not correct`
        }
    }

    const secret = process.env['JWT_SECRET'];
    const payload = {
        email: userEmail,
        password: userPassword,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    return {
        message: 'Successfully signed in',
        token
    }
}

module.exports = { getAccessToken };
