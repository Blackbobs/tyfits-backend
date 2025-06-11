import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/types';

const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
         const user = req.userInfo; 

  if (user?.role !== Role.admin) {
     res.status(403).json({ message: 'Access denied: Admins only' });
     return
  }

  next(); 
    } catch (error) {
      console.log("Error in isAdmin middleware:", error);
      res.status(500).json({ message: 'Internal server error' });  
    }

};

export default adminMiddleware;