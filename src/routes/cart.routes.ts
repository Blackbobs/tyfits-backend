import { Router } from 'express';
import {
  addToCart,
  getCart,
  removeCart,
  clearCart,
  updateCart,
} from '../controllers/cart.controller';
import authMiddleware from '../middlewares/auth.middleware';

const cartRouter = Router();

cartRouter.post('/',authMiddleware, addToCart);
cartRouter.get('/',authMiddleware, getCart);
cartRouter.put('/:productId', authMiddleware, updateCart);
cartRouter.delete('/clear',authMiddleware, clearCart);
cartRouter.delete('/:productId',authMiddleware, removeCart);

export default cartRouter;
