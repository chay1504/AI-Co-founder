// src/middleware/logger.ts

import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${elapsed}ms)`);
  });
  
  next();
};
