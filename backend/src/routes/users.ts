// src/routes/users.ts

import express, { Request, Response } from 'express';
import { userService } from '@/services/user.service';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * POST /api/users
 * Create a new user (add to team).
 */
router.post('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { team_id, email, full_name, role } = req.body;
    
    if (!team_id || !email) {
      return res.status(400).json({ success: false, data: null, error: 'Team ID and email are required' });
    }
    
    const user = await userService.createUser({ team_id, email, full_name, role });
    
    res.json({ success: true, data: user, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to create user' });
  }
});

/**
 * GET /api/users/:id
 * Get details for a specific user.
 */
router.get('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }
    
    res.json({ success: true, data: user, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/users/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/users/:id
 * Update details for a specific user.
 */
router.patch('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedUser = await userService.updateUser(userId, updateData);
    
    res.json({ success: true, data: updatedUser, error: null });
    
  } catch (error) {
    console.error('Error in PATCH /api/users/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Remove a user (soft delete).
 */
router.delete('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    await userService.removeUser(userId);
    
    res.json({ success: true, data: { id: userId, deleted: true }, error: null });
    
  } catch (error) {
    console.error('Error in DELETE /api/users/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to remove user' });
  }
});

/**
 * GET /api/users/team/:teamId
 * Get all users for a specific team.
 */
router.get('/users/team/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const users = await userService.getUsersByTeam(teamId);
    
    res.json({ success: true, data: users, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/users/team/:teamId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

export default router;
