// src/routes/integrations.ts

import express, { Request, Response } from 'express';
import { slackService } from '@/services/slack.service';
import { githubService } from '@/services/github.service';
import { authMiddleware } from '@/middleware/auth';
import { getAgenda } from '@/jobs/scheduler';

const router = express.Router();

/**
 * POST /api/integrations/slack/connect
 * Start Slack OAuth flow.
 */
router.post('/integrations/slack/connect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const url = await slackService.getConnectUrl();
    res.json({ success: true, data: { url }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed to initiate Slack connection' });
  }
});

/**
 * POST /api/integrations/slack/callback
 * Handle Slack OAuth callback.
 */
router.post('/integrations/slack/callback', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, teamId } = req.body;
    const result = await slackService.handleCallback(code, teamId);
    res.json({ success: true, data: result, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * POST /api/integrations/github/connect
 * Connect GitHub using Personal Access Token (PAT).
 */
router.post('/integrations/github/connect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { pat, userId } = req.body;
    const result = await githubService.connectAccount(userId, pat);
    res.json({ success: true, data: result, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed to connect GitHub' });
  }
});

/**
 * GET /api/integrations/status/:teamId
 * Check current status of team integrations.
 */
router.get('/integrations/status/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if team has valid tokens in 'integrations' table (dummy implementation)
    res.json({ success: true, data: { slack: 'connected', github: 'connected' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * POST /api/integrations/sync/manual/:teamId
 * Force a manual sync.
 */
router.post('/integrations/sync/manual/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const agenda = getAgenda();
    await agenda.now('sync-slack-messages', { teamId });
    await agenda.now('sync-github-commits', { teamId });
    res.json({ success: true, data: { message: 'Sync jobs triggered' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * Admin: Run all scheduled jobs.
 */
router.post('/admin/sync-all-teams', authMiddleware, async (req: Request, res: Response) => {
  try {
    const agenda = getAgenda();
    await agenda.now('sync-slack-messages');
    await agenda.now('sync-github-commits');
    await agenda.now('calculate-health-score');
    res.json({ success: true, data: { message: 'All sync jobs triggered' }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * Admin: Get last 100 job logs.
 */
router.get('/admin/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Dummy logs from memory as per prompt
    res.json({ success: true, data: { logs: [] }, error: null });
  } catch (error) {
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

export default router;
