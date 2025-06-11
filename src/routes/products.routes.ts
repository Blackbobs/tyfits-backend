import { Router } from 'express';
import { createProduct } from '../controllers/product.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';
import { uploadFile, uploadImages } from '../middlewares/upload.middleware';

const productsRouter = Router();

// get all products
productsRouter.get('/');

// Create a new product
productsRouter.post(
  '/create',
  authMiddleware,
  adminMiddleware,
  (req, res, next) => {
    const isDigital =
      req.body?.isDigital === 'true' || req.body?.isDigital === true;
    if (isDigital) {
      uploadFile(req, res, next);
    } else {
      uploadImages(req, res, next);
    }
  },
  createProduct,
);
