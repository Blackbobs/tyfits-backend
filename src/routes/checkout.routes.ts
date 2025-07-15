import express from 'express';
import { createCheckoutSession, stripeWebhook } from '../controllers/checkout.controller';
import authMiddleware from '../middlewares/auth.middleware';


const checkoutRouter = express.Router();

checkoutRouter.post('/create-session', authMiddleware, createCheckoutSession);
checkoutRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default checkoutRouter;