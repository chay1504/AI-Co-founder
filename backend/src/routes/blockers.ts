// src/routes/blockers.ts

import express, { Request, Response } from 'express';
import { blockerService } from '@/services/blocker.service';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * POST /api/blockers
 * Create a new blocker.
 */
router.post('/blockers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const blockerData = req.body;
    
    if (!blockerData.team_id || !blockerData.project_id || !blockerData.title) {
      return res.status(400).json({ success: false, data: null, error: 'Team ID, Project ID and title are required' });
    }
    
    const blocker = await blockerService.createBlocker(blockerData);
    
    res.json({ success: true, data: blocker, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/blockers:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to create blocker' });
  }
});

/**
 * GET /api/blockers/:id
 * Get details for a specific blocker.
 */
router.get('/blockers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const blockerId = parseInt(req.params.id);
    const blocker = await blockerService.getBlockerById(blockerId);
    
    if (!blocker) {
      return res.status(404).json({ success: false, data: null, error: 'Blocker not found' });
    }
    
    res.json({ success: true, data: blocker, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/blockers/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * PATCH /api/blockers/:id
 * Update details for a specific blocker.
 */
router.patch('/blockers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const blockerId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedBlocker = await blockerService.updateBlocker(blockerId, updateData);
    
    res.json({ success: true, data: updatedBlocker, error: null });
    
  } catch (error) {
    console.error('Error in PATCH /api/blockers/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * DELETE /api/blockers/:id
 * Resolve or delete a blocker.
 */
router.delete('/blockers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const blockerId = parseInt(req.params.id);
    await blockerService.resolveBlocker(blockerId);
    
    res.json({ success: true, data: { id: blockerId, resolved: true }, error: null });
    
  } catch (error) {
    console.error('Error in DELETE /api/blockers/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/blockers/team/:teamId
 * Get all blockers for a specific team.
 */
router.get('/blockers/team/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const blockers = await blockerService.getBlockersByTeam(teamId);
    
    res.json({ success: true, data: blockers, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/blockers/team/:teamId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * GET /api/blockers/team/:teamId/active
 * Get active blockers for a specific team.
 */
router.get('/blockers/team/:teamId/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const blockers = await blockerService.getActiveBlockersByTeam(teamId);
    
    res.json({ success: true, data: blockers, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/blockers/team/:teamId/active:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

export default router;
