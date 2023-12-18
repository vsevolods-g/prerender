const { MongoClient } = require('mongodb');

class MongoDBClient {
    constructor() {
        this.client = new MongoClient('mongodb://localhost:27017', { auth: { username: 'root', password: 'scandipwa' }});
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

    async getCachedPages(pageSize, page, urlFilter, filterCondition, urlDomain, sortBy, sortDirection) {
        const skip = (page - 1) * pageSize;
    const query = this.buildQuery(urlFilter, filterCondition, urlDomain);
    const formattedSortDirection = sortDirection === 'DESC' ? -1 : 1;
    const sort = sortBy ? { [sortBy]: formattedSortDirection } : { _id: -1 };

    return await this.collection
        .find(query)
        .project({ status: 1, expirationTime: 1, key: 1, createdAt: 1 , content: 1 })
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .toArray();
    }

    buildQuery(urlFilter, filterCondition, urlDomain) {
        let query = {};

        if (urlFilter) {
            switch (filterCondition) {
                case 'contains':
                    query["key"] = new RegExp(`.*${urlFilter}.*`, 'i');
                    break;
                case 'doesNotContain':
                    query["key"] = { $not: new RegExp(`.*${urlFilter}.*`, 'i') };
                    break;
                case 'equals':
                    query["key"] = urlFilter;
                    break;
                case 'notEquals':
                    query["key"] = { $ne: urlFilter };
                    break;
                case 'startsWith':
                    query["key"] = new RegExp(`^${urlFilter}`, 'i');
                    break;
                case 'endsWith':
                    query["key"] = new RegExp(`${urlFilter}$`, 'i');
                    break;
            }
        }

        if (urlDomain) {
            query["key"] = { ...query["key"], $regex: new RegExp(`^https?://(?:www\.)?${urlDomain}`) };
        }

        return query;
    }

    async getTotalCachePagesCount() {
        return await this.collection
            .countDocuments();
    }

    async getUniqueDomains() {
        const domains = await this.collection.aggregate([
            {
                $addFields: {
                    domain: {
                        $arrayElemAt: [
                            {
                                $split: [
                                    {
                                        $arrayElemAt: [
                                            { $split: ["$key", "//"] },
                                            1
                                        ]
                                    },
                                    "/"
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $toLower: "$domain" }
                }
            },
            {
                $project: {
                    _id: 0,
                    domain: "$_id"
                }
            }
        ]).toArray();
    
        return domains.map(d => d.domain).filter(Boolean);
    }    
}

module.exports = { MongoDBClient };