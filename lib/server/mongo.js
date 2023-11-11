const { MongoClient } = require('mongodb');

class MongoDBClient {
    constructor(options) {
        const { url } = options;

        this.client = new MongoClient(url, { auth: { username: 'root', password: 'scandipwa' }});
        this.databaseName = process.env['MONGO_DB_DATABASE_NAME'];
        this.cacheCollection = process.env['MONGO_DB_CACHE_COLLECTION'];
        this.expirationTimeByStatus = {
            '200': process.env['200_STATUS_CACHE_DAYS'] || 30,
            '404': process.env['404_STATUS_CACHE_DAYS'] || 1,
            '301': process.env['301_STATUS_CACHE_DAYS'] || 0,
            '302': process.env['302_STATUS_CACHE_DAYS'] || 0,
        };
    }

    async connect() {
        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        this.collection = this.db.collection(this.cacheCollection);
    }

    async createTTLIndex() {
        this.collection.createIndex({ expirationTime: 1 }, { expireAfterSeconds: 0 });
    }

    async insertCache(params) {
        const { status, content, url } = params;

        const cacheTimeInDays = this.expirationTimeByStatus[status];


        if (!cacheTimeInDays) {
            return;
        }

        const ttl = new Date(Date.now() + cacheTimeInDays * 24 * 60 * 60 * 1000);

        const document = {
            key: url,
            status,
            content,
            expirationTime: ttl,
            createdAt: new Date(Date.now())
        }

        try {
            await this.collection.insertOne(document);
        } catch(e) {
            console.log(`Error while adding cache for ${url}, reason: ${e}`)
        }
    }

    async getCache(url) {
        return await this.collection.findOne({ "key": url });
    }

    async deleteCache(url) {
        return await this.collection.deleteOne({ "key": url });
    }

    async getCachedPages(pageSize, page, domain) {
        const skip = (page - 1) * pageSize;
        const query = domain ? { "key": { $regex: `.*${domain}.*` } } : {};

        return await this.collection
            .find(query)
            .project({ status: 1, expirationTime: 1, key: 1 })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(Number(pageSize))
            .toArray();
    }
}

module.exports = { MongoDBClient };