const { MongoDBClient } = require('../../mongo');
const bcrypt = require('bcrypt');

const createNewAccount = async (parent, args, contextValue, info) => {
    const { email, password } = args;

    const mongo = new MongoDBClient()
    await mongo.connect();
    const usersCollection = mongo.db.collection('users');

    const ifExists = usersCollection.findOne({ email });

    if (ifExists) {
        return {
            success: false,
            message: "User with given email already exists"
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const { acknowledged } = await usersCollection.insertOne({
        email,
        password: hashedPassword
    });

    return {
        success: acknowledged,
        message: "Successfully create user"
    };
}

module.exports = { createNewAccount };
