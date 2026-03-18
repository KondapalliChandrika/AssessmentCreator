import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
        });
        redis.on('connect', () => console.log('✅ Redis connected'));
        redis.on('error', (err) => console.error('❌ Redis error:', err));
    }
    return redis;
}

export const cacheService = {
    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },

    async get<T>(key: string): Promise<T | null> {
        const data = await getRedis().get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    },

    async del(key: string): Promise<void> {
        await getRedis().del(key);
    },

    async setJobProgress(jobId: string, progress: number, message: string): Promise<void> {
        await getRedis().set(
            `assignment:status:${jobId}`,
            JSON.stringify({ progress, message }),
            'EX',
            3600
        );
    },

    async getJobProgress(jobId: string): Promise<{ progress: number; message: string } | null> {
        const data = await getRedis().get(`assignment:status:${jobId}`);
        if (!data) return null;
        return JSON.parse(data);
    },
};
