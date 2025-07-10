import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/types';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userInfo) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (req.userInfo.role !== Role.admin) {
      res.status(403).json({ message: 'Access denied: Admins only' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export default adminMiddleware;
