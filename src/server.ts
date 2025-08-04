import dotenv from "dotenv";
import express  from "express";
import config from "./config/config";
import cors from "cors"
import usersRouter from "./routes/users.routes";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/error.middleware";
import productsRouter from "./routes/products.routes";
import cartRouter from "./routes/cart.routes";
import checkoutRouter from "./routes/checkout.routes";
// import { stripeWebhook } from "./controllers/checkout.controller";
// import bodyParser from "body-parser";

if (process.env.NODE_ENV === 'production') {
  import('./utils/self-ping')
}

dotenv.config()

const app = express();
const PORT = config.PORT || 3000;

// app.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), stripeWebhook);

app.use(cors({
  // origin: 'http://localhost:3000',
  origin: 'http://192.168.113.86:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/v1/users', usersRouter)
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/checkout', checkoutRouter)

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