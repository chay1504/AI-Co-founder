// src/routes/workSignals.ts

import express, { Request, Response } from 'express';
import { workSignalService } from '@/services/workSignal.service';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * POST /api/work-signals
 * Manually store a work signal (useful for custom integrations).
 */
router.post('/work-signals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const signalData = req.body;
    
    if (!signalData.team_id || !signalData.user_id || !signalData.source) {
      return res.status(400).json({ success: false, data: null, error: 'Team ID, User ID and source are required' });
    }
    
    const signal = await workSignalService.createSignal(signalData);
    
    res.json({ success: true, data: signal, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/work-signals:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/work-signals/user/:userId
 * Get all signals for a specific user.
 */
router.get('/work-signals/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const signals = await workSignalService.getSignalsByUser(userId);
    
    res.json({ success: true, data: signals, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/work-signals/user/:userId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/work-signals/project/:projectId
 * Get all signals for a specific project.
 */
router.get('/work-signals/project/:projectId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const signals = await workSignalService.getSignalsByProject(projectId);
    
    res.json({ success: true, data: signals, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/work-signals/project/:projectId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/work-signals/team/:teamId
 * Get all signals for a team with optional date range filters.
 */
router.get('/work-signals/team/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    
    const signals = await workSignalService.getSignalsByTeam(teamId, from, to);
    
    res.json({ success: true, data: signals, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/work-signals/team/:teamId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

export default router;
