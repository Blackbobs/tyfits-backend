import { Request, Response, NextFunction } from 'express';
import { ProductType } from '../types/types';

export function validateProductType(req: Request, res: Response, next: NextFunction) {
  const type = req.body?.type;
  if (![ProductType.digital, ProductType.physical].includes(type)) {
    return res.status(400).json({ message: 'Invalid or missing product type' });
  }
  next();
}
