import {Router} from 'express';
import { signUp, signIn, getAllCustomers } from '../controllers/user.controller';

const usersRouter = Router()

usersRouter.get("/", getAllCustomers);

// Create a new user
usersRouter.post("/signup", signUp)
usersRouter.post("/signin", signIn)

export default usersRouter