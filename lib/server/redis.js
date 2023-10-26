const redis = require('redis');

class RedisClient {
    constructor() {
        this.redisClient = undefined;

        this.expirationTimeByStatus = {
            '200': process.env['200_STATUS_CACHE_DAYS'] || 30,
            '404': process.env['404_STATUS_CACHE_DAYS'] || 1,
            '301': process.env['301_STATUS_CACHE_DAYS'] || 0,
            '302': process.env['302_STATUS_CACHE_DAYS'] || 0,
        }
    }

    async init() {
        try {
        this.redisClient = await redis.createClient({
            url: 'redis://127.0.0.1:6379'
        }).connect();
        } catch(e) {
            console.log(`Error during connection to redis: ${e}`);
            process.exit(0);
        }
    }

    async cachePage(url, content, status) {
        const cacheTimeInDays = this.expirationTimeByStatus[status];

        if (!cacheTimeInDays) {
            return;
        }

        await this.redisClient.set(url, JSON.stringify({ status, content }), {
            NX: true,
            // Convert days into seconds
            EX: cacheTimeInDays * 24 * 60 * 60
        })
    }

    async getCachedPage(url) {
        return await this.redisClient.get(url);
    }

    async clearCacheForPage(url) {
        return await this.redisClient.del(url);
    }
}

module.exports = { RedisClient };