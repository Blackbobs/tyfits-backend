import { NextFunction, Request, Response } from "express";
import redisCache from "../config/redis.config";
import logger from "../config/logger.config";
import { generateCacheKey } from "../utils/redis-cache";

export const cacheMiddleware = (duration: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let key: string;

    // Match by route or path
    if (req.path.startsWith("/products") && req.method === "GET") {
      if (req.params.id) {
        // Product detail
        key = generateCacheKey.productDetail(req.params.id);
      } else if (req.path.includes("/search")) {
        // Product search
        key = generateCacheKey.productSearch(req.query);
      } else {
        // Product list
        key = generateCacheKey.productList(req.query);
      }
    } else {
      // Fallback for other routes
      key = `cache:${req.originalUrl}`;
    }

    try {
      const cached = await redisCache.getJson<unknown>(key);
      if (cached) {
        res.set("X-Cache", "HIT");
        res.status(200).json(cached);
        return;
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        redisCache
          .setJson(key, body, duration)
          .catch((err: Error) => {
            logger.error(`Cache set error: ${err.message}`);
          });
        res.set("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error(`Cache middleware error: ${err.message}`);
      } else {
        logger.error(`Unknown cache middleware error occurred`);
      }
      next();
    }
  };
};


export const cacheControl = (duration: number) => (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    res.set('Cache-Control', `public, max-age=${duration}`);
    next();
  };