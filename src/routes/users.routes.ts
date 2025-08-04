import {Router} from 'express';
import { signUp, signIn, getAllCustomers, changePassword, updateProfile, refreshToken } from '../controllers/user.controller';

const usersRouter = Router()

usersRouter.get("/", getAllCustomers);

// Create a new user
usersRouter.post("/signup", signUp)
usersRouter.post("/signin", signIn)
usersRouter.put('/change-password', changePassword);
usersRouter.put('/profile', updateProfile);
usersRouter.post('/refresh', refreshToken);

export default usersRouter