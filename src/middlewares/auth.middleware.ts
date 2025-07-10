// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Role } from '../types/types';

// Extend Express Request interface to include userInfo
declare module 'express-serve-static-core' {
  interface Request {
    userInfo?: {
      id: string;
      email: string;
      role: Role;
    };
  }
}

interface DecodedToken {
  id: string;
  email: string;
  role: Role;
  exp: number;
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
     res.status(401).json({ message: 'Unauthorized - No token provided' });
     return
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.secretKey) as DecodedToken;
    
    // Check if token is expired
    if (Date.now() >= decoded.exp * 1000) {
       res.status(401).json({ message: 'Token expired' });
       return
    }

    req.userInfo = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
     res.status(401).json({ message: 'Invalid token' });
     return
  }
};

export default authMiddleware