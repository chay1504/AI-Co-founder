// src/jobs/healthScoreCalc.job.ts

import { Agenda } from 'agenda';
import { prisma } from '@/utils/db';
import { healthScoreService } from '@/services/healthScore.service';

/**
 * Registers the 'calculate-health-score' job with Agenda.js.
 * This job runs daily (2 AM UTC as per prompt) to compute snapshots.
 */
export const registerHealthScoreCalcJob = (agenda: Agenda) => {
  agenda.define('calculate-health-score', async (job) => {
    try {
      console.log('🔄 Running Health Score Calculation job...');
      
      // 1. Get all active teams
      const teams = await prisma.teams.findMany({
        where: { is_active: true }
      });
      
      // 2. Calculate for each team
      for (const team of teams) {
        try {
          await healthScoreService.calculateHealthScore(Number(team.id));
          console.log(`✅ Calculated health score for team: ${team.name}`);
        } catch (error) {
          console.error(`❌ Failed to calculate health score for team ${team.name}:`, error);
        }
      }
      
      console.log('✅ Health Score Calculation job completed');
      
    } catch (error) {
      console.error('❌ Health Score Calculation job failed:', error);
      throw error;
    }
  });
};
