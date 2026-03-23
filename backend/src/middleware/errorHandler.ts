// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // As per SKILL_1_EXPRESS_API, generic errors shouldn't expose database structure
  const responseMessage = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred. Please contact support.' 
    : message;
  
  res.status(status).json({
    success: false,
    data: null,
    error: responseMessage
  });
};
