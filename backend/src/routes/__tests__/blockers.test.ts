// src/routes/__tests__/blockers.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    blockers: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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
import blockersRouter from '@/routes/blockers';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', blockersRouter);
  app.use(errorHandler);
  return app;
}

const mockBlocker = {
  id: 1,
  team_id: 1,
  project_id: 1,
  title: 'Design review pending',
  description: null,
  owner_id: null,
  severity: 'high',
  status: 'open',
  days_stalled: 0,
  created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

describe('POST /api/blockers', () => {
  test('Test 1.1: Should create blocker with valid data', async () => {
    (prisma.blockers.create as jest.Mock).mockResolvedValue(mockBlocker);
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, project_id: 1, title: 'Design review pending', severity: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 1.2: Should reject missing team_id', async () => {
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ project_id: 1, title: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.3: Should reject missing project_id', async () => {
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, title: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.4: Should reject missing title', async () => {
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, project_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.5: Should auto-set status to "open"', async () => {
    (prisma.blockers.create as jest.Mock).mockResolvedValue({ ...mockBlocker, status: 'open' });
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, project_id: 1, title: 'X', severity: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('open');
  });

  test('Test 1.6: Should auto-set days_stalled to 0', async () => {
    (prisma.blockers.create as jest.Mock).mockResolvedValue({ ...mockBlocker, days_stalled: 0 });
    const res = await request(buildApp())
      .post('/api/blockers')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, project_id: 1, title: 'X', severity: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.data.days_stalled).toBe(0);
  });

  test('Test 1.7: Should reject without JWT', async () => {
    const res = await request(buildApp()).post('/api/blockers').send({ team_id: 1, project_id: 1, title: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/blockers/:id', () => {
  test('Test 2.1: Should fetch existing blocker', async () => {
    (prisma.blockers.findUnique as jest.Mock).mockResolvedValue(mockBlocker);
    const res = await request(buildApp())
      .get('/api/blockers/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2.2: Should return 404 for non-existent blocker', async () => {
    (prisma.blockers.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/blockers/9999')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/blockers/:id', () => {
  test('Test 3.1: Should update blocker status', async () => {
    (prisma.blockers.update as jest.Mock).mockResolvedValue({ ...mockBlocker, status: 'in_progress' });
    const res = await request(buildApp())
      .patch('/api/blockers/1')
      .set('Authorization', VALID_JWT)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('Test 3.2: Should update severity', async () => {
    (prisma.blockers.update as jest.Mock).mockResolvedValue({ ...mockBlocker, severity: 'critical' });
    const res = await request(buildApp())
      .patch('/api/blockers/1')
      .set('Authorization', VALID_JWT)
      .send({ severity: 'critical' });
    expect(res.status).toBe(200);
    expect(res.body.data.severity).toBe('critical');
  });

  test('Test 3.3: Should update days_stalled', async () => {
    (prisma.blockers.update as jest.Mock).mockResolvedValue({ ...mockBlocker, days_stalled: 3 });
    const res = await request(buildApp())
      .patch('/api/blockers/1')
      .set('Authorization', VALID_JWT)
      .send({ days_stalled: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.days_stalled).toBe(3);
  });

  test('Test 3.4: Should return error for non-existent blocker', async () => {
    (prisma.blockers.update as jest.Mock).mockRejectedValue(new Error('not found'));
    const res = await request(buildApp())
      .patch('/api/blockers/9999')
      .set('Authorization', VALID_JWT)
      .send({ status: 'resolved' });
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/blockers/:id', () => {
  test('Test 4.1: Should resolve blocker', async () => {
    (prisma.blockers.update as jest.Mock).mockResolvedValue({ ...mockBlocker, status: 'resolved' });
    const res = await request(buildApp())
      .delete('/api/blockers/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.resolved).toBe(true);
  });

  test('Test 4.2: Should return error for non-existent blocker', async () => {
    (prisma.blockers.update as jest.Mock).mockRejectedValue(new Error('not found'));
    const res = await request(buildApp())
      .delete('/api/blockers/9999')
      .set('Authorization', VALID_JWT);
    expect([404, 500]).toContain(res.status);
  });
});

describe('GET /api/blockers/team/:teamId', () => {
  test('Test 5.1: Should return all blockers for team', async () => {
    (prisma.blockers.findMany as jest.Mock).mockResolvedValue([
      mockBlocker, { ...mockBlocker, id: 2 }, { ...mockBlocker, id: 3 }
    ]);
    const res = await request(buildApp())
      .get('/api/blockers/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 5.2: Should return empty array if no blockers', async () => {
    (prisma.blockers.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/blockers/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/blockers/team/:teamId/active', () => {
  test('Test 6.1: Should return only active (open) blockers', async () => {
    (prisma.blockers.findMany as jest.Mock).mockResolvedValue([
      { ...mockBlocker, id: 1, status: 'open' },
      { ...mockBlocker, id: 2, status: 'open' },
    ]);
    const res = await request(buildApp())
      .get('/api/blockers/team/1/active')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    res.body.data.forEach((b: any) => expect(b.status).toBe('open'));
  });
});
