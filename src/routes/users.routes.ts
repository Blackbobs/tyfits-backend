import {Router} from 'express';
import { signUp, signIn, getAllCustomers, changePassword, updateProfile, refreshToken, getCustomerDetails } from '../controllers/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';

const usersRouter = Router()

usersRouter.get("/", getAllCustomers);
usersRouter.get('/customer/:id', authMiddleware, adminMiddleware, getCustomerDetails);

// Create a new user
usersRouter.post("/signup", signUp)
usersRouter.post("/signin", signIn)
usersRouter.put('/change-password', changePassword);
usersRouter.put('/profile', updateProfile);
usersRouter.post('/refresh', refreshToken);

export default usersRouter