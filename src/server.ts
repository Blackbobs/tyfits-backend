import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import config from "./config/config";
import cors from "cors"
import usersRouter from "./routes/users.routes";
import connectDB from "./config/db";
import errorMiddleware from "./middlewares/error.middleware";
import productsRouter from "./routes/products.routes";
import cartRouter from "./routes/cart.routes";
import checkoutRouter from "./routes/checkout.routes";
import orderRouter from "./routes/orders.routes";
// import { stripeWebhook } from "./controllers/checkout.controller";
// import bodyParser from "body-parser";

if (process.env.NODE_ENV === 'production') {
  import('./utils/self-ping')
}

dotenv.config();

const app = express();
const PORT = config.PORT || 3000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.113.86:3000',
  'https://tyhub.vercel.app',
  'https://tyhub-admin.vercel.app',
];

// ✅ Use CORS before routes
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routers
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/checkout', checkoutRouter)

app.use('/', (_req, res) => {
  res.send("Welcome to TyFits");
});

// CORS error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
     res.status(403).json({ error: 'CORS policy blocked this request' });
     return
  }
  next(err);
});



app.use(errorMiddleware);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer()