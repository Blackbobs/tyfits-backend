import {Router} from 'express';
import { signUp, signIn } from '../controllers/users.controller';

const usersRouter = Router()

// Get all users
usersRouter.get("/", () => {})

// Create a new user
usersRouter.post("/signup", signUp)
usersRouter.post("/signin", signIn)

export default usersRouter