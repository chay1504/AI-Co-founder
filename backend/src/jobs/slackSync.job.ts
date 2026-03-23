// src/jobs/slackSync.job.ts

import { Agenda } from 'agenda';
import { prisma } from '@/utils/db';
import { slackService } from '@/services/slack.service';

/**
 * Registers the 'sync-slack-messages' job with Agenda.js.
 * This job runs hourly to fetch latest messages from Slack.
 */
export const registerSlackSyncJob = (agenda: Agenda) => {
  agenda.define('sync-slack-messages', async (job) => {
    try {
      console.log('🔄 Running Slack Sync job...');
      
      // 1. Get all active teams
      const teams = await prisma.teams.findMany({
        where: { is_active: true }
      });
      
      // 2. Sync for each team
      for (const team of teams) {
        try {
          await slackService.syncTeamMessages(Number(team.id));
          console.log(`✅ Synced Slack for team: ${team.name}`);
        } catch (error) {
          console.error(`❌ Failed to sync Slack for team ${team.name}:`, error);
        }
      }
      
      console.log('✅ Slack Sync job completed');
      
    } catch (error) {
      console.error('❌ Slack Sync job failed:', error);
      throw error;
    }
  });
};
