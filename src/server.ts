import dotenv from "dotenv";
import express  from "express";
import config from "./config/config";
import cors from "cors"
import usersRouter from "./routes/users.routes";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/error.middleware";

dotenv.config

const app = express();
const PORT = config.PORT || 3000;

app.use(cors())
app.use(express.json())


app.use('/api/v1/users', usersRouter)

app.use('/', (_req, res) =>{
    res.send("Welcome to hub digital")
})

app.use(errorMiddleware);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer()