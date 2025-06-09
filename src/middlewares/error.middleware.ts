import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: number;
  errors?: Record<string, { message: string }>;
}

const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let statusCode = err.status || 500;
  let message = err.message || 'Server Error';

  console.error('Error caught:', err);

  
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id ${err.message}`;
  }

  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as any).keyValue)[0];
    message = `Duplicate value entered for field '${field}'`;
  }

  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
  } catch (error) {
    console.error('Error in errorMiddleware:', error);
    next(error);
     res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
  
};

export default errorMiddleware
