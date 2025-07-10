import { Router } from 'express';
import {
  addToCart,
  getCart,
  removeCart,
  clearCart,
} from '../controllers/cart.controller';

const cartRouter = Router();

cartRouter.post('/', addToCart);
cartRouter.get('/', getCart);
cartRouter.delete('/clear', clearCart);
cartRouter.delete('/:productId', removeCart);

export default cartRouter;
