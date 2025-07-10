import { Router } from 'express';
import {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from '../controllers/product.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';
import { ProductType } from '../types/types';
import Product from '../models/product.model';
import { uploadProductAssets } from '../middlewares/upload.middleware';

const productsRouter = Router();

productsRouter.get('/', getAllProducts);
productsRouter.get('/:id', getProductById);

productsRouter.post(
  '/create',
  authMiddleware,
  adminMiddleware,
   uploadProductAssets,
  createProduct,
);

productsRouter.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
   uploadProductAssets,
  updateProduct,
);

productsRouter.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default productsRouter;
