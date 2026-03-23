// src/index.ts

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { initializeScheduler } from './jobs/scheduler';

// Import Routes
import teamsRouter from './routes/teams';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import workSignalsRouter from './routes/workSignals';
import healthScoreRouter from './routes/healthScore';
import blockersRouter from './routes/blockers';
import integrationsRouter from './routes/integrations';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Standard request logging

// Custom Logging Middleware (as per prompt)
app.use(logger);

// Base Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { status: 'healthy', timestamp: new Date() },
    error: null
  });
});

// Feature Routes
app.use('/api', teamsRouter);
app.use('/api', usersRouter);
app.use('/api', projectsRouter);
app.use('/api', workSignalsRouter);
app.use('/api', healthScoreRouter);
app.use('/api', blockersRouter);
app.use('/api', integrationsRouter);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start Server & Scheduler
const startServer = async () => {
  try {
    // Initialize Agenda.js
    await initializeScheduler();
    
    app.listen(PORT, () => {
      console.log(`🚀 AI Co-Founder Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
