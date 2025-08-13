import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';
import logger from './logger.config';

// Cache duration in seconds (1 hour)
const DEFAULT_CACHE_DURATION = 3600;

// Type for Redis errors
type RedisError = Error & { 
  code?: string;
  command?: string;
  args?: any[];
};

class RedisCache {
  private client: RedisClient;
  private static instance: RedisCache;

  private constructor() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        // Exponential backoff
        const delay = Math.min(times * 100, 5000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    };

    this.client = new Redis(options);
    this.registerEvents();
  }

  // Singleton pattern
  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  private registerEvents(): void {
    this.client.on('error', (err: RedisError) => {
      logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('end', () => {
      logger.info('Redis connection closed');
    });
  }

  // Basic cache operations
  public async set(
    key: string,
    value: string,
    duration: number = DEFAULT_CACHE_DURATION
  ): Promise<void> {
    try {
      if (duration > 0) {
        await this.client.setex(key, duration, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis set error: ${error.message}`);
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis delete error: ${error.message}`);
      return 0;
    }
  }

  public async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis flushAll error: ${error.message}`);
    }
  }

  // JSON helpers
  public async setJson(
    key: string,
    value: any,
    duration: number = DEFAULT_CACHE_DURATION
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), duration);
  }

  private async handleCacheOperation<T>(operation: () => Promise<T>, context: string): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`Cache ${context} error: ${error.message}`);
      return null; // Fail gracefully
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    return this.handleCacheOperation<T>(
      async () => {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      },
      'get'
    );
  }

  // Pattern-based deletion
  public async deletePattern(pattern: string): Promise<void> {
    try {
      const stream = this.client.scanStream({
        match: pattern,
      });

      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          const pipeline = this.client.pipeline();
          keys.forEach((key) => pipeline.del(key));
          pipeline.exec().catch((err: RedisError) => {
            logger.error(`Pipeline exec error: ${err.message}`);
          });
        }
      });

      await new Promise((resolve) => {
        stream.on('end', resolve);
      });
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis deletePattern error: ${error.message}`);
    }
  }

  // Close connection
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis disconnect error: ${error.message}`);
    }
  }

  // Health check
  public async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (err: unknown) {
      const error = err as RedisError;
      logger.error(`Redis ping error: ${error.message}`);
      return 'Redis not available';
    }
  }

  // Cluster support
  public isCluster(): boolean {
    return this.client instanceof Redis.Cluster;
  }
}

const redisCache = RedisCache.getInstance();

export default redisCache;