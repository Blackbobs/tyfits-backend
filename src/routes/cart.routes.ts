import { Router } from 'express';
import {
  addToCart,
  getCart,
  removeCart,
  clearCart,
} from '../controllers/cart.controller';
import authMiddleware from '../middlewares/auth.middleware';

const cartRouter = Router();

cartRouter.post('/',authMiddleware, addToCart);
cartRouter.get('/',authMiddleware, getCart);
cartRouter.delete('/clear',authMiddleware, clearCart);
cartRouter.delete('/:productId',authMiddleware, removeCart);

export default cartRouter;
