const { MongoClient, ObjectId } = require('mongodb');

class MongoDBClient {
  constructor() {
    this.client = new MongoClient('mongodb://localhost:27017', {
      auth: { username: 'root', password: 'scandipwa' },
    });
    this.databaseName = process.env['MONGO_DB_DATABASE_NAME'];
    this.cacheCollection = process.env['MONGO_DB_CACHE_COLLECTION'];
    this.expirationTimeByStatus = {
      200: process.env['200_STATUS_CACHE_DAYS'] || 30,
      404: process.env['404_STATUS_CACHE_DAYS'] || 1,
      301: process.env['301_STATUS_CACHE_DAYS'] || 0,
      302: process.env['302_STATUS_CACHE_DAYS'] || 0,
    };
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.databaseName);
    this.collection = this.db.collection(this.cacheCollection);
  }

  async createTTLIndex() {
    this.collection.createIndex(
      { expirationTime: 1 },
      { expireAfterSeconds: 0 },
    );
  }

  async getUserById(userId) {
    try {
      const usersCollection = this.db.collection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      return user;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
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
      createdAt: new Date(Date.now()),
    };

    try {
      await this.collection.insertOne(document);
    } catch (e) {
      console.log(`Error while adding cache for ${url}, reason: ${e}`);
    }
  }

  async getCache(url) {
    return await this.collection.findOne({ key: url });
  }

  async deleteCache(url) {
    return await this.collection.deleteOne({ key: url });
  }

  async updateCache(params) {
    const { status, content, url } = params;

    const cacheTimeInDays = this.expirationTimeByStatus[status];

    const ttl = new Date(Date.now() + cacheTimeInDays * 24 * 60 * 60 * 1000);

    try {
      await this.collection.updateOne(
        { key: url },
        {
          $set: {
            status,
            content,
            expirationTime: ttl,
            updatedAt: new Date(Date.now()),
          },
        },
        { upsert: true },
      );
    } catch (e) {
      console.log(`Error while updating cache for ${url}, reason: ${e}`);
    }
  }

  async updateRecacheTaskStatus({ url, status }) {
    const recacheTaskCollection = this.db.collection('recacheTasks');
    await recacheTaskCollection.updateOne(
      { key: url },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getQueueDetails(limit, skip) {
    const recacheTaskCollection = this.db.collection('recacheTasks');

    const totalCount = await recacheTaskCollection.countDocuments({});

    const queueItems = await recacheTaskCollection
      .find({})
      .limit(limit)
      .skip(skip)
      .toArray();

    const items = queueItems.map((item) => ({
      url: item.key,
      status: item.status,
      updatedAt: item.updatedAt,
    }));

    return {
      items,
      totalCount,
    };
  }

  async getCachePageContent(key) {
    const query = { key };
    const result = await this.collection.findOne(query, {
      projection: { content: 1 },
    });

    if (!result) {
      throw new Error('Cache page not found');
    }

    return result.content;
  }

  async getCachedPages(
    pageSize,
    page,
    urlFilter,
    filterCondition,
    urlDomain,
    sortBy,
    sortDirection,
    organizationIds,
  ) {
    const skip = (page - 1) * pageSize;
    const query = await this.buildQuery(
      urlFilter,
      filterCondition,
      urlDomain,
      organizationIds,
    );
    const formattedSortDirection = sortDirection === 'DESC' ? -1 : 1;
    const sort = sortBy ? { [sortBy]: formattedSortDirection } : { _id: -1 };
    const recacheTaskCollection = this.db.collection('recacheTasks');

    const results = await this.collection
      .aggregate([
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: Number(pageSize) },
        {
          $lookup: {
            from: recacheTaskCollection.collectionName,
            localField: 'key',
            foreignField: 'key',
            as: 'queueInfo',
          },
        },
        {
          $project: {
            status: 1,
            expirationTime: 1,
            key: 1,
            createdAt: 1,
            content: 1,
            isQueued: {
              $cond: {
                if: {
                  $eq: [{ $arrayElemAt: ['$queueInfo.status', 0] }, 'queued'],
                },
                then: true,
                else: false,
              },
            },
          },
        },
      ])
      .toArray();

    return results.length > 0 ? results : [];
  }

  async buildQuery(urlFilter, filterCondition, urlDomain, organizationIds) {
    let query = {};

    let allDomains = [];
    if (urlDomain) {
      allDomains = [urlDomain];
    } else {
      const organizationDomains =
        await this.getDomainsForOrganizations(organizationIds);
      allDomains = [...organizationDomains].filter(Boolean);
    }

    let conditions = [];

    // Build query for URL filter if provided
    if (urlFilter) {
      conditions.push({
        key: this.buildUrlFilterQuery(urlFilter, filterCondition),
      });
    }

    // Add domain filter to the query
    if (allDomains.length > 0) {
      conditions.push({
        key: {
          $regex: new RegExp(
            `^https?://(?:www\\.)?(${allDomains
              .map((domain) => `(${domain})`)
              .join('|')})`,
          ),
        },
      });
    }

    if (conditions.length > 0) {
      query['$and'] = conditions;
    }

    return query;
  }

  buildUrlFilterQuery(urlFilter, filterCondition) {
    switch (filterCondition) {
      case 'contains':
        return new RegExp(`.*${urlFilter}.*`, 'i');
      case 'doesNotContain':
        return { $not: new RegExp(`.*${urlFilter}.*`, 'i') };
      case 'equals':
        return urlFilter;
      case 'notEquals':
        return { $ne: urlFilter };
      case 'startsWith':
        return new RegExp(`^${urlFilter}`, 'i');
      case 'endsWith':
        return new RegExp(`${urlFilter}$`, 'i');
      default:
        return {};
    }
  }

  async getDomainsForOrganizations(organizationIds) {
    try {
      const mongo = new MongoDBClient();
      await mongo.connect();
      const organizationsCollection = mongo.db.collection('organizations');

      const organizations = await organizationsCollection
        .find({
          _id: { $in: organizationIds.map((id) => new ObjectId(id)) },
        })
        .toArray();
      const domains = await this.getUniqueDomains();
      const orgDomains = organizations.reduce(
        (domains, org) => domains.concat(org.domains || []),
        [],
      );
      const filteredDomains = domains.filter((domain) =>
        orgDomains.includes(domain),
      );

      return filteredDomains;
    } catch (error) {
      console.error('Error in getDomainsForOrganizations:', error);
      return [];
    }
  }

  async getTotalCachePagesCount(
    urlFilter,
    filterCondition,
    urlDomain,
    organizationIds,
  ) {
    const query = await this.buildQuery(
      urlFilter,
      filterCondition,
      urlDomain,
      organizationIds,
    );
    const totalCount = await this.collection.countDocuments(query);

    return totalCount;
  }

  async getUniqueDomains() {
    const domains = await this.collection
      .aggregate([
        {
          $addFields: {
            domain: {
              $arrayElemAt: [
                {
                  $split: [
                    {
                      $arrayElemAt: [{ $split: ['$key', '//'] }, 1],
                    },
                    '/',
                  ],
                },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: { $toLower: '$domain' },
          },
        },
        {
          $project: {
            _id: 0,
            domain: '$_id',
          },
        },
      ])
      .toArray();

    if (!domains || domains.length === 0) {
      return [];
    }

    return domains.map((d) => d.domain).filter(Boolean);
  }
}

module.exports = { MongoDBClient };
