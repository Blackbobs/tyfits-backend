import { NextFunction, Request, Response } from "express";
import redisCache from "../config/redis.config";
import logger from "../config/logger.config";

export const cacheMiddleware = (duration: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redisCache.getJson<unknown>(key);
      if (cached) {
         res.status(200).json(cached);
         return
      }
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache responses
      res.json = (body: any) => {
        redisCache.setJson(key, body, duration)
          .catch((err: Error) => {
            logger.error(`Cache set error: ${err.message}`);
          });
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