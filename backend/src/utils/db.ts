// src/utils/db.ts

import { PrismaClient } from '@prisma/client';

// Simple instance for the whole app
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

// Optionally extend the client for better performance on large datasets
// Example: paginate() or better transactions
