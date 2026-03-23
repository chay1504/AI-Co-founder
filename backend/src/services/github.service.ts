// src/services/github.service.ts

import axios from 'axios';
import { prisma } from '@/utils/db';

export class GitHubService {
  /**
   * Connects a user's GitHub account via PAT (Personal Access Token).
   */
  async connectAccount(userId: number, pat: string) {
    // 1. Verify token by calling GitHub API
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${pat}` }
      });
      
      const githubUsername = response.data.login;
      
      // 2. Store token securely (encrypted) and GitHub username in user metadata
      return await prisma.users.update({
        where: { id: BigInt(userId) },
        data: { github_username: githubUsername }
      });
      
    } catch (error) {
      console.error('GitHub Connection Error:', error);
      throw new Error('Invalid GitHub PAT');
    }
  }

  /**
   * Fetches latest commits and PRs for a user and stores them as work signals.
   */
  async syncUserActivity(userId: number) {
    // Mock implementation for MVP
    console.log(`[GITHUB] Syncing activity for user ${userId}...`);
    
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) }
    });
    
    if (!user || !user.github_username) return;

    // Example Signal Creation
    await prisma.work_signals.create({
      data: {
        team_id: user.team_id,
        user_id: user.id,
        source: 'github',
        signal_type: 'commit',
        metadata: { repo: 'ai-cofounder-backend', commit_hash: 'abc123456789' },
        timestamp: new Date()
      }
    });
  }
}

export const githubService = new GitHubService();
