import { Router } from 'express';
import {
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/order.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';

const orderRouter = Router();

// Get all orders for the current user
orderRouter.get('/user',authMiddleware,adminMiddleware, getUserOrders);

// Get all orders (admin)
orderRouter.get('/',authMiddleware,adminMiddleware, getAllOrders);

// Update order status
orderRouter.put('/:orderId/status',authMiddleware,adminMiddleware, updateOrderStatus);

// Delete an order
orderRouter.delete('/:orderId',authMiddleware,adminMiddleware, deleteOrder);

export default orderRouter;
