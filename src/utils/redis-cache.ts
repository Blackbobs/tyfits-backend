import { Request, Response } from "express";
import logger from "../config/logger.config";
import redisCache from "../config/redis.config";

export const generateCacheKey = {
    productList: (queryParams = {}) => {
      const queryString = Object.keys(queryParams).length > 0 
        ? `:${JSON.stringify(queryParams)}` 
        : '';
      return `products:list${queryString}`;
    },
    productDetail: (id: string) => `products:detail:${id}`,
    productSearch: (searchParams: any) => `products:search:${JSON.stringify(searchParams)}`
  };


export const invalidateProductCaches = async (productId?: string) => {
    try {
      if (productId) {
        await redisCache.del(generateCacheKey.productDetail(productId));
      }
      await redisCache.deletePattern(generateCacheKey.productList('*'));
      await redisCache.deletePattern(generateCacheKey.productSearch('*'));
    } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(`Cache invalidation error: ${error.message}`);
        } else {
          logger.error('Unknown cache invalidation error occurred');
        }
      }
  };

//   export const getCacheStatus = async (req: Request, res: Response) => {
//     try {
//       const pingResponse = await redisCache.ping();
//       res.status(200).json({
//         status: pingResponse === 'PONG' ? 'healthy' : 'unhealthy',
//         response: pingResponse,
//       });
//     } catch (error) {
//       res.status(500).json({ status: 'unhealthy', error: error.message });
//     }
//   };
  