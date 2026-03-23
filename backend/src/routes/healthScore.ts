// src/routes/healthScore.ts

import express, { Request, Response } from 'express';
import { healthScoreService } from '@/services/healthScore.service';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * GET /api/health-score/:teamId
 * Get the most recent health score for a team.
 */
router.get('/health-score/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const score = await healthScoreService.getCurrentHealthScore(teamId);
    
    if (!score) {
      return res.status(404).json({ success: false, data: null, error: 'No health score snapshot found' });
    }
    
    res.json({ success: true, data: score, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/health-score/:teamId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/health-score/:teamId/history
 * Get a history of health scores for a team over time.
 */
router.get('/health-score/:teamId/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    
    const history = await healthScoreService.getHealthScoreHistory(teamId, days);
    
    res.json({ success: true, data: history, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/health-score/:teamId/history:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * POST /api/health-score/:teamId/calculate
 * Trigger a new health score calculation for a team.
 */
router.post('/health-score/:teamId/calculate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const score = await healthScoreService.calculateHealthScore(teamId);
    
    res.json({ success: true, data: score, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/health-score/:teamId/calculate:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to recalculate health score' });
  }
});

export default router;
