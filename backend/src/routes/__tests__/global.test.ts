// src/routes/__tests__/global.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    teams: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    health_score_snapshots: {
      findFirst: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('@/jobs/scheduler', () => ({
  initializeScheduler: jest.fn(),
  getAgenda: jest.fn().mockReturnValue({ now: jest.fn() }),
}));

import request from 'supertest';
import express, { Request, Response } from 'express';
import { prisma } from '@/utils/db';
import { verifyClerkToken } from '@/utils/clerk';
import teamsRouter from '@/routes/teams';
import usersRouter from '@/routes/users';
import healthScoreRouter from '@/routes/healthScore';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildFullApp() {
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ success: true, data: { status: 'healthy' }, error: null });
  });
  app.use('/api', teamsRouter);
  app.use('/api', usersRouter);
  app.use('/api', healthScoreRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

describe('Health Check & Error Handling', () => {
  test('Test 1.1: Should return health check (no JWT needed)', async () => {
    const res = await request(buildFullApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  test('Test 1.2: Should handle generic 500 errors gracefully', async () => {
    (prisma.teams.findUnique as jest.Mock).mockRejectedValue(new Error('Unexpected DB crash'));
    const res = await request(buildFullApp())
      .get('/api/teams/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    // Error message should not expose raw DB error
    expect(res.body.error).not.toContain('Unexpected DB crash');
  });

  test('Test 1.3: Should handle malformed JSON body', async () => {
    const res = await request(buildFullApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .set('Content-Type', 'application/json')
      .send('{ bad json :::');
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.4: Should return consistent { success, data, error } format', async () => {
    const mockTeam = {
      id: 1, name: 'Eng', slug: 'eng', company_id: 'uid',
      is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    (prisma.teams.create as jest.Mock).mockResolvedValue(mockTeam);
    (prisma.teams.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.health_score_snapshots.findFirst as jest.Mock).mockResolvedValue(null);

    const checks = [
      { method: 'post', path: '/api/teams', body: { name: 'Eng', slug: 'eng' } },
      { method: 'get',  path: '/api/teams/9999', body: null },
      { method: 'get',  path: '/api/users/9999', body: null },
      { method: 'get',  path: '/api/health-score/1', body: null },
    ];

    for (const check of checks) {
      const req = (request(buildFullApp()) as any)[check.method](check.path)
        .set('Authorization', VALID_JWT);
      if (check.body) req.send(check.body);
      const res = await req;
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('error');
    }
  });

  test('Test 1.5: Should include timestamps in created resources', async () => {
    const now = new Date().toISOString();
    (prisma.teams.create as jest.Mock).mockResolvedValue({
      id: 1, name: 'Eng', slug: 'eng', company_id: 'uid',
      is_active: true, created_at: now, updated_at: now,
    });
    const res = await request(buildFullApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Eng', slug: 'eng' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('created_at');
    expect(res.body.data).toHaveProperty('updated_at');
  });
});
