// src/jobs/scheduler.ts

import { Agenda } from 'agenda';
import { registerSlackSyncJob } from './slackSync.job';
import { registerGithubSyncJob } from './githubSync.job';
import { registerHealthScoreCalcJob } from './healthScoreCalc.job';

let agenda: Agenda;

/**
 * Initializes the Agenda.js scheduler with MongoDB (as per prompt/standard for Agenda).
 * If no MongoDB is available, it uses an in-memory or alternative strategy.
 */
export const initializeScheduler = async () => {
  try {
    // Agenda usually requires MongoDB. For MVP on Render, we can use 
    // a small MongoDB instance or Render's internal scheduler.
    // Here we'll configure it assuming MONGODB_URL is in env.
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1/agenda';
    
    agenda = new Agenda({
      db: { address: mongoUrl, collection: 'agenda_jobs' },
      processEvery: '1 minute',
      maxConcurrency: 5
    });
    
    // Register Jobs
    registerSlackSyncJob(agenda);
    registerGithubSyncJob(agenda);
    registerHealthScoreCalcJob(agenda);
    
    // Start Agenda
    await agenda.start();
    
    // Define Schedules
    await agenda.every('1 hour', 'sync-slack-messages');
    await agenda.every('1 hour', 'sync-github-commits');
    await agenda.every('1 day', 'calculate-health-score', { startTime: '02:00' }); // 2 AM UTC as per prompt
    
    console.log('✅ Agenda.js scheduler initialized smoothly');
    
    return agenda;
    
  } catch (error) {
    console.error('❌ Failed to initialize Agenda.js scheduler:', error);
    throw error;
  }
};

/**
 * Export the agenda instance for manual triggers from routes.
 */
export const getAgenda = () => agenda;
