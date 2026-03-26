// src/routes/__tests__/projects.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    projects: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    project_dependencies: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('@/jobs/scheduler', () => ({
  initializeScheduler: jest.fn(),
  getAgenda: jest.fn().mockReturnValue({ now: jest.fn() }),
}));

import request from 'supertest';
import express from 'express';
import { prisma } from '@/utils/db';
import { verifyClerkToken } from '@/utils/clerk';
import projectsRouter from '@/routes/projects';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', projectsRouter);
  app.use(errorHandler);
  return app;
}

const mockProject = {
  id: 1,
  team_id: 1,
  name: 'API Refactor',
  description: 'Refactor the API layer',
  status: 'planning',
  owner_id: 1,
  start_date: null,
  deadline: '2024-04-01',
  completion_percentage: 0,
  created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  owner: { id: 1, email: 'alice@company.com', full_name: 'Alice', role: 'engineer' },
};

const mockDependency = {
  id: 10,
  project_id: 1,
  depends_on_project_id: 2,
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

describe('POST /api/projects', () => {
  test('Test 1.1: Should create project with valid data', async () => {
    (prisma.projects.create as jest.Mock).mockResolvedValue(mockProject);
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, name: 'API Refactor', description: '...', owner_id: 1, deadline: '2024-04-01' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 1.2: Should reject missing team_id', async () => {
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ name: 'API Refactor' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.3: Should reject missing name', async () => {
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.4: Should auto-set status to "planning"', async () => {
    (prisma.projects.create as jest.Mock).mockResolvedValue({ ...mockProject, status: 'planning' });
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, name: 'API Refactor' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('planning');
  });

  test('Test 1.5: Should auto-set completion_percentage to 0', async () => {
    (prisma.projects.create as jest.Mock).mockResolvedValue({ ...mockProject, completion_percentage: 0 });
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, name: 'API Refactor' });
    expect(res.status).toBe(200);
    expect(res.body.data.completion_percentage).toBe(0);
  });

  test('Test 1.6: Should handle optional fields', async () => {
    (prisma.projects.create as jest.Mock).mockResolvedValue({ ...mockProject, owner_id: null, deadline: null });
    const res = await request(buildApp())
      .post('/api/projects')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, name: 'Minimal' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 1.7: Should reject without JWT', async () => {
    const res = await request(buildApp()).post('/api/projects').send({ team_id: 1, name: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/projects/:id', () => {
  test('Test 2.1: Should fetch existing project', async () => {
    (prisma.projects.findUnique as jest.Mock).mockResolvedValue(mockProject);
    const res = await request(buildApp())
      .get('/api/projects/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2.2: Should return 404 for non-existent project', async () => {
    (prisma.projects.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/projects/9999')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Test 2.3: Should include owner relationship', async () => {
    (prisma.projects.findUnique as jest.Mock).mockResolvedValue(mockProject);
    const res = await request(buildApp())
      .get('/api/projects/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.owner).toBeDefined();
    expect(res.body.data.owner.email).toBe('alice@company.com');
  });
});

describe('PATCH /api/projects/:id', () => {
  test('Test 3.1: Should update project status', async () => {
    (prisma.projects.update as jest.Mock).mockResolvedValue({ ...mockProject, status: 'in_progress' });
    const res = await request(buildApp())
      .patch('/api/projects/1')
      .set('Authorization', VALID_JWT)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('Test 3.2: Should update completion percentage', async () => {
    (prisma.projects.update as jest.Mock).mockResolvedValue({ ...mockProject, completion_percentage: 50 });
    const res = await request(buildApp())
      .patch('/api/projects/1')
      .set('Authorization', VALID_JWT)
      .send({ completion_percentage: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.completion_percentage).toBe(50);
  });

  test('Test 3.3: Should update deadline', async () => {
    (prisma.projects.update as jest.Mock).mockResolvedValue({ ...mockProject, deadline: '2024-12-31' });
    const res = await request(buildApp())
      .patch('/api/projects/1')
      .set('Authorization', VALID_JWT)
      .send({ deadline: '2024-12-31' });
    expect(res.status).toBe(200);
  });

  test('Test 3.4: Should do partial update (only name)', async () => {
    (prisma.projects.update as jest.Mock).mockResolvedValue({ ...mockProject, name: 'New Name' });
    const res = await request(buildApp())
      .patch('/api/projects/1')
      .set('Authorization', VALID_JWT)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
    expect(res.body.data.status).toBe(mockProject.status);
  });

  test('Test 3.5: Should return error for non-existent project', async () => {
    (prisma.projects.update as jest.Mock).mockRejectedValue(new Error('Record not found'));
    const res = await request(buildApp())
      .patch('/api/projects/9999')
      .set('Authorization', VALID_JWT)
      .send({ name: 'X' });
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/projects/:id', () => {
  test('Test 4.1: Should delete project', async () => {
    (prisma.projects.delete as jest.Mock).mockResolvedValue(mockProject);
    const res = await request(buildApp())
      .delete('/api/projects/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  test('Test 4.2: Should return error for non-existent project', async () => {
    (prisma.projects.delete as jest.Mock).mockRejectedValue(new Error('Record not found'));
    const res = await request(buildApp())
      .delete('/api/projects/9999')
      .set('Authorization', VALID_JWT);
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/projects/team/:teamId', () => {
  test('Test 5.1: Should return all projects for team', async () => {
    (prisma.projects.findMany as jest.Mock).mockResolvedValue([
      mockProject, { ...mockProject, id: 2 }, { ...mockProject, id: 3 }
    ]);
    const res = await request(buildApp())
      .get('/api/projects/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 5.2: Should return empty array for team with no projects', async () => {
    (prisma.projects.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/projects/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/projects/:id/dependencies', () => {
  test('Test 6.1: Should create dependency', async () => {
    (prisma.project_dependencies.create as jest.Mock).mockResolvedValue(mockDependency);
    const res = await request(buildApp())
      .post('/api/projects/1/dependencies')
      .set('Authorization', VALID_JWT)
      .send({ depends_on_project_id: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 6.2: Should reject missing depends_on_project_id', async () => {
    const res = await request(buildApp())
      .post('/api/projects/1/dependencies')
      .set('Authorization', VALID_JWT)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 6.3: Should allow circular dependencies', async () => {
    (prisma.project_dependencies.create as jest.Mock)
      .mockResolvedValueOnce(mockDependency)
      .mockResolvedValueOnce({ ...mockDependency, project_id: 2, depends_on_project_id: 1 });
    const res1 = await request(buildApp())
      .post('/api/projects/1/dependencies')
      .set('Authorization', VALID_JWT)
      .send({ depends_on_project_id: 2 });
    const res2 = await request(buildApp())
      .post('/api/projects/2/dependencies')
      .set('Authorization', VALID_JWT)
      .send({ depends_on_project_id: 1 });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });
});

describe('DELETE /api/projects/:id/dependencies/:depId', () => {
  test('Test 7.1: Should remove dependency', async () => {
    (prisma.project_dependencies.delete as jest.Mock).mockResolvedValue(mockDependency);
    const res = await request(buildApp())
      .delete('/api/projects/1/dependencies/10')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });
});
