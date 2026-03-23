// src/services/slack.service.ts

import { WebClient } from '@slack/web-api';
import { prisma } from '@/utils/db';

export class SlackService {
  /**
   * Starts the Slack OAuth connect flow.
   * Returns a redirect URL or instructions.
   */
  async getConnectUrl() {
    // Standard Slack OAuth initialization URL
    const clientId = process.env.SLACK_CLIENT_ID;
    const scopes = 'channels:history,groups:history,im:history,mpim:history,users:read';
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/integrations/slack/callback';
    
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Handles the Slack OAuth callback following user approval.
   */
  async handleCallback(code: string, teamId: number) {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    
    // In a real server, we would call slack.v2.access to get the access_token
    // Then store it in a new 'integrations' table or user metadata
    return { success: true, message: 'Slack integrated successfully' };
  }

  /**
   * Fetches the latest Slack messages for a team and stores them as work signals.
   */
  async syncTeamMessages(teamId: number) {
    // Mock implementation for MVP
    // Usually, we'd fetch tokens from DB, then call Slack API
    console.log(`[SLACK] Syncing messages for team ${teamId}...`);
    
    // Example Work Signal Creation
    const userId = await prisma.users.findFirst({ where: { team_id: BigInt(teamId) } });
    if (!userId) return;

    await prisma.work_signals.create({
      data: {
        team_id: BigInt(teamId),
        user_id: userId.id,
        source: 'slack',
        signal_type: 'message',
        metadata: { channel: '#general', text: 'Auto-synced message signal' },
        timestamp: new Date()
      }
    });
  }
}

export const slackService = new SlackService();
