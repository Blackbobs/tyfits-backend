import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';
import logger from './logger.config';

// Cache duration in seconds (1 hour)
const DEFAULT_CACHE_DURATION = 3600;

// Extended Redis error type
type RedisError = Error & {
  code?: string;
  command?: string;
  args?: any[];
};

class RedisCache {
  private client: RedisClient;
  private static instance: RedisCache;

  private constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTls = process.env.REDIS_TLS === 'true';
  
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: isProduction ? process.env.REDIS_USER || 'default' : undefined,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      
      
      ...(isTls ? {
        tls: {
          rejectUnauthorized: false 
        }
      } : {}),
      
      
      retryStrategy: (times) => Math.min(times * 100, 5000),
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
      connectTimeout: 10000, 
      commandTimeout: 5000   
    };
  
    this.client = new Redis(options);
    this.registerEvents();
  }

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

  private handleRedisError(error: unknown, context: string): RedisError {
    if (error instanceof Error) {
      const redisError = error as RedisError;
      logger.error(`Redis ${context} error: ${redisError.message}`);
      return redisError;
    }
    logger.error(`Unknown Redis ${context} error occurred`);
    return new Error(`Unknown Redis ${context} error`) as RedisError;
  }

  public async set(
    key: string,
    value: string,
    duration: number = DEFAULT_CACHE_DURATION
  ): Promise<boolean> {
    try {
      if (duration > 0) {
        await this.client.setex(key, duration, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error: unknown) {
      this.handleRedisError(error, 'set operation');
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: unknown) {
      this.handleRedisError(error, 'get operation');
      return null;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error: unknown) {
      this.handleRedisError(error, 'delete operation');
      return 0;
    }
  }

  public async flushAll(): Promise<boolean> {
    try {
      await this.client.flushall();
      return true;
    } catch (error: unknown) {
      this.handleRedisError(error, 'flushAll operation');
      return false;
    }
  }

  public async setJson(
    key: string,
    value: any,
    duration: number = DEFAULT_CACHE_DURATION
  ): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);
      return await this.set(key, stringValue, duration);
    } catch (error: unknown) {
      this.handleRedisError(error, 'setJson operation');
      return false;
    }
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const data = await this.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error: unknown) {
      this.handleRedisError(error, 'getJson operation');
      return null;
    }
  }

  public async deletePattern(pattern: string): Promise<boolean> {
    try {
      const keys: string[] = [];
      const stream = this.client.scanStream({ match: pattern });

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (foundKeys: string[]) => {
          keys.push(...foundKeys);
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error: unknown) {
      this.handleRedisError(error, 'deletePattern operation');
      return false;
    }
  }

  public async disconnect(): Promise<boolean> {
    try {
      await this.client.quit();
      return true;
    } catch (error: unknown) {
      this.handleRedisError(error, 'disconnect operation');
      return false;
    }
  }

  public async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error: unknown) {
      const err = this.handleRedisError(error, 'ping operation');
      return `Redis not available: ${err.message}`;
    }
  }

  public isCluster(): boolean {
    return this.client instanceof Redis.Cluster;
  }
}

const redisCache = RedisCache.getInstance();
export default redisCache;