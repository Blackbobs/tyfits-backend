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
import { uploadProductAssets } from '../middlewares/upload.middleware';
import { cacheControl, cacheMiddleware } from '../middlewares/cache.middleware';

const productsRouter = Router();

productsRouter.get('/', cacheControl(300), cacheMiddleware(), getAllProducts);
productsRouter.get('/:id',cacheControl(3600), cacheMiddleware(), getProductById);

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
