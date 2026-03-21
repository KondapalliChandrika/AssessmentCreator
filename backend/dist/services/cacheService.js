"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
exports.getRedis = getRedis;
const ioredis_1 = __importDefault(require("ioredis"));
let redis = null;
function getRedis() {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const isTls = redisUrl.startsWith('rediss://');
        redis = new ioredis_1.default(redisUrl, {
            tls: isTls ? {} : undefined,
            maxRetriesPerRequest: null,
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            },
            lazyConnect: true,
        });
        redis.connect().catch(console.error);
        redis.on('connect', () => console.log('✅ Redis connected'));
        redis.on('error', (err) => console.error('❌ Redis error:', err));
    }
    return redis;
}
exports.cacheService = {
    async set(key, value, ttlSeconds) {
        await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },
    async get(key) {
        const data = await getRedis().get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    },
    async del(key) {
        await getRedis().del(key);
    },
    async setJobProgress(jobId, progress, message) {
        await getRedis().set(`assignment:status:${jobId}`, JSON.stringify({ progress, message }), 'EX', 3600);
    },
    async getJobProgress(jobId) {
        const data = await getRedis().get(`assignment:status:${jobId}`);
        if (!data)
            return null;
        return JSON.parse(data);
    },
};
