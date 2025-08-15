import { Request, Response } from "express";
import logger from "../config/logger.config";
import redisCache from "../config/redis.config";

export const generateCacheKey = {
  productList: (queryParams: Record<string, any> = {}) => {
    const keys = Object.keys(queryParams).sort();
    if (keys.length === 0) return `products:list`;

    const queryString = keys
      .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join("&");

    return `products:list:${queryString}`;
  },

  productDetail: (id: string) => `products:detail:${id}`,

  productSearch: (searchParams: Record<string, any> = {}) => {
    const keys = Object.keys(searchParams).sort();
    if (keys.length === 0) return `products:search`;

    const queryString = keys
      .map((key) => `${key}=${encodeURIComponent(searchParams[key])}`)
      .join("&");

    return `products:search:${queryString}`;
  }
};

export const invalidateProductCaches = async (productId?: string) => {
  try {
    if (productId) {
      await redisCache.del(generateCacheKey.productDetail(productId));
    }

    // Wipe all product lists and searches
    await redisCache.deletePattern("products:list*");
    await redisCache.deletePattern("products:search*");

  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Cache invalidation error: ${error.message}`);
    } else {
      logger.error("Unknown cache invalidation error occurred");
    }
  }
};

  
  export const getCacheStatus = async (req: Request, res: Response) => {
    try {
      const pingResponse = await redisCache.ping();
      res.status(200).json({
        status: pingResponse === 'PONG' ? 'healthy' : 'unhealthy',
        response: pingResponse,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
      res.status(500).json({ 
        status: 'unhealthy', 
        error: errorMessage 
      });
    }
  };
  