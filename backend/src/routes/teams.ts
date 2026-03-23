// src/routes/teams.ts

import express, { Request, Response } from 'express';
import { teamService } from '@/services/team.service';
import { authMiddleware } from '@/middleware/auth';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * POST /api/teams
 * Create a new team.
 */
router.post('/teams', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    const companyId = req.user.user_id; // From Clerk JWT
    
    if (!name || !slug) {
      return res.status(400).json({ success: false, data: null, error: 'Name and slug are required' });
    }
    
    const team = await teamService.createTeam({ name, slug, company_id: companyId });
    
    res.json({ success: true, data: team, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/teams:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to create team' });
  }
});

/**
 * GET /api/teams/:id
 * Get details for a specific team.
 */
router.get('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const team = await teamService.getTeamById(teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, data: null, error: 'Team not found' });
    }
    
    res.json({ success: true, data: team, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/teams/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch team' });
  }
});

/**
 * PATCH /api/teams/:id
 * Update details for a specific team.
 */
router.patch('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedTeam = await teamService.updateTeam(teamId, updateData);
    
    res.json({ success: true, data: updatedTeam, error: null });
    
  } catch (error) {
    console.error('Error in PATCH /api/teams/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to update team' });
  }
});

/**
 * GET /api/teams/:id/members
 * Get all users belonging to a specific team.
 */
router.get('/teams/:id/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const members = await teamService.getTeamMembers(teamId);
    
    res.json({ success: true, data: members, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/teams/:id/members:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch team members' });
  }
});

export default router;
