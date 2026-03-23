// src/routes/projects.ts

import express, { Request, Response } from 'express';
import { projectService } from '@/services/project.service';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

/**
 * POST /api/projects
 * Create a new project.
 */
router.post('/projects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { team_id, name, description, owner_id, start_date, deadline } = req.body;
    
    if (!team_id || !name) {
      return res.status(400).json({ success: false, data: null, error: 'Team ID and name are required' });
    }
    
    const project = await projectService.createProject({ team_id, name, description, owner_id, start_date, deadline });
    
    res.json({ success: true, data: project, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects/:id
 * Get details for a specific project.
 */
router.get('/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await projectService.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, data: null, error: 'Project not found' });
    }
    
    res.json({ success: true, data: project, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/projects/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch project' });
  }
});

/**
 * PATCH /api/projects/:id
 * Update details for a specific project.
 */
router.patch('/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedProject = await projectService.updateProject(projectId, updateData);
    
    res.json({ success: true, data: updatedProject, error: null });
    
  } catch (error) {
    console.error('Error in PATCH /api/projects/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * DELETE /api/projects/:id
 * Remove a project.
 */
router.delete('/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    await projectService.deleteProject(projectId);
    
    res.json({ success: true, data: { id: projectId, deleted: true }, error: null });
    
  } catch (error) {
    console.error('Error in DELETE /api/projects/:id:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to delete project' });
  }
});

/**
 * GET /api/projects/team/:teamId
 * Get all projects belonging to a team.
 */
router.get('/projects/team/:teamId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const projects = await projectService.getProjectsByTeam(teamId);
    
    res.json({ success: true, data: projects, error: null });
    
  } catch (error) {
    console.error('Error in GET /api/projects/team/:teamId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

/**
 * POST /api/projects/:id/dependencies
 * Add a new dependency for a project.
 */
router.post('/projects/:id/dependencies', authMiddleware, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { depends_on_project_id } = req.body;
    
    if (!depends_on_project_id) {
      return res.status(400).json({ success: false, data: null, error: 'Depends on project ID is required' });
    }
    
    const dependency = await projectService.addDependency(projectId, depends_on_project_id);
    
    res.json({ success: true, data: dependency, error: null });
    
  } catch (error) {
    console.error('Error in POST /api/projects/:id/dependencies:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to add dependency' });
  }
});

/**
 * DELETE /api/projects/:id/dependencies/:depId
 * Remove a project dependency.
 */
router.delete('/projects/:id/dependencies/:depId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const depId = parseInt(req.params.depId);
    await projectService.removeDependency(depId);
    
    res.json({ success: true, data: { id: depId, deleted: true }, error: null });
    
  } catch (error) {
    console.error('Error in DELETE /api/projects/:id/dependencies/:depId:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed' });
  }
});

export default router;
