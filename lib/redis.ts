import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

const client = createClient({
  url: redisUrl
});

client.on('error', (err) => console.error('[Redis] Client Error:', err));

// Connect to Redis
let isConnected = false;

export async function connectRedis() {
  if (!isConnected && !client.isOpen) {
    await client.connect();
    isConnected = true;
    console.log('[Redis] Connected successfully');
  }
  return client;
}

// Auto-connect on first import (for server components)
if (redisUrl) {
  connectRedis().catch(console.error);
}

// Wrapper that provides Upstash-compatible API for db.ts
export const redis = {
  async get<T>(key: string): Promise<T | null> {
    await connectRedis();
    const value = await client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    await connectRedis();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (options?.ex) {
      await client.setEx(key, options.ex, serialized);
    } else {
      await client.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await connectRedis();
    await client.del(key);
  },

  async keys(pattern: string): Promise<string[]> {
    await connectRedis();
    return client.keys(pattern);
  },

  async exists(key: string): Promise<boolean> {
    await connectRedis();
    const result = await client.exists(key);
    return result === 1;
  },

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    await connectRedis();
    const values = await client.mGet(keys);
    return values.map(v => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as T;
      }
    });
  },

  async sadd(key: string, ...members: string[]): Promise<void> {
    await connectRedis();
    await client.sAdd(key, members);
  },

  async smembers(key: string): Promise<string[]> {
    await connectRedis();
    return client.sMembers(key);
  },

  async sismember(key: string, member: string): Promise<boolean> {
    await connectRedis();
    const result = await client.sIsMember(key, member);
    return Boolean(result);
  },

  async incr(key: string): Promise<number> {
    await connectRedis();
    return client.incr(key);
  },

  async lpush(key: string, ...values: string[]): Promise<void> {
    await connectRedis();
    await client.lPush(key, values);
  },

  async rpush(key: string, ...values: string[]): Promise<void> {
    await connectRedis();
    await client.rPush(key, values);
  },

  async lrem(key: string, count: number, element: string): Promise<number> {
    await connectRedis();
    return client.lRem(key, count, element);
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    await connectRedis();
    return client.lRange(key, start, stop);
  }
};
