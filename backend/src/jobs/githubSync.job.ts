import { Agenda, Job } from 'agenda';
import { prisma } from '@/utils/db';
import { githubService } from '@/services/github.service';

/**
 * Registers the 'sync-github-commits' job with Agenda.js.
 * This job runs hourly to fetch latest activity from GitHub.
 */
export const registerGithubSyncJob = (agenda: Agenda) => {
  agenda.define('sync-github-commits', async (job: Job) => {
    try {
      console.log('🔄 Running GitHub Sync job...');
      
      // 1. Get all active users
      const users = await prisma.users.findMany({
        where: { is_active: true }
      });
      
      // 2. Sync for each user
      for (const user of users) {
        if (!user.github_username) continue; // Skip if no GitHub username
        
        try {
          await githubService.syncUserActivity(Number(user.id));
          console.log(`✅ Synced GitHub for user: ${user.full_name}`);
        } catch (error) {
          console.error(`❌ Failed to sync GitHub for user ${user.full_name}:`, error);
        }
      }
      
      console.log('✅ GitHub Sync job completed');
      
    } catch (error) {
      console.error('❌ GitHub Sync job failed:', error);
      throw error;
    }
  });
};
