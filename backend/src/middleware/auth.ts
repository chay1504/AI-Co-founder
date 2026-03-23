// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { verifyClerkToken } from '@/utils/clerk';

// Extend the Request interface to include a user object
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authorization token is required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // As per ANTI_GRAVITY_BACKEND_PROMPT, verify with Clerk
    const verifiedUser = await verifyClerkToken(token);
    
    if (!verifiedUser) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid or expired authorization token'
      });
    }
    
    req.user = verifiedUser;
    next();
    
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(401).json({
      success: false,
      data: null,
      error: 'Authentication failed'
    });
  }
};
