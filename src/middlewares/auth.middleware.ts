import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';

declare global {
  namespace Express {
    interface Request {
      userInfo?: any;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
     res.status(401).json({
      message: 'Access denied. No token provided',
    });
    return
  }

  try {
    const decodedTokenInfo = jwt.verify(token, config.secretKey);
    req.userInfo = decodedTokenInfo;
    next();
  } catch (error) {
     res.status(401).json({
      message: 'Access denied. No token provided',
    });
    return
  }
};
export default authMiddleware;
