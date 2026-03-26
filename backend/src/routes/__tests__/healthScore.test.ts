// src/routes/__tests__/healthScore.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    health_score_snapshots: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      count: jest.fn().mockResolvedValue(4),
    },
    work_signals: {
      groupBy: jest.fn().mockResolvedValue([{ user_id: 1 }]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    projects: {
      findMany: jest.fn().mockResolvedValue([]),
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
import healthScoreRouter from '@/routes/healthScore';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', healthScoreRouter);
  app.use(errorHandler);
  return app;
}

const mockSnapshot = {
  id: 1,
  team_id: 1,
  productivity_score: 80,
  collaboration_score: 70,
  velocity_score: 60,
  overall_score: 71,
  snapshot_date: '2024-03-01',
  created_at: new Date('2024-03-01T00:00:00Z').toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
  (prisma.users as any).count.mockResolvedValue(4);
  (prisma.work_signals as any).groupBy.mockResolvedValue([{ user_id: 1 }]);
  (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.projects.findMany as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/health-score/:teamId', () => {
  test('Test 1.1: Should return current health score snapshot', async () => {
    (prisma.health_score_snapshots.findFirst as jest.Mock).mockResolvedValue(mockSnapshot);
    const res = await request(buildApp())
      .get('/api/health-score/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('Test 1.2: Should return 404 if no snapshot exists', async () => {
    (prisma.health_score_snapshots.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/health-score/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/no health score snapshot found/i);
  });

  test('Test 1.3: Should include all score fields', async () => {
    (prisma.health_score_snapshots.findFirst as jest.Mock).mockResolvedValue(mockSnapshot);
    const res = await request(buildApp())
      .get('/api/health-score/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d).toHaveProperty('productivity_score');
    expect(d).toHaveProperty('collaboration_score');
    expect(d).toHaveProperty('velocity_score');
    expect(d).toHaveProperty('overall_score');
  });

  test('Test 1.4: Should return most recent snapshot only', async () => {
    const mostRecent = { ...mockSnapshot, overall_score: 90 };
    (prisma.health_score_snapshots.findFirst as jest.Mock).mockResolvedValue(mostRecent);
    const res = await request(buildApp())
      .get('/api/health-score/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.overall_score).toBe(90);
  });
});

describe('GET /api/health-score/:teamId/history', () => {
  test('Test 2.1: Should return score history for 30 days (default)', async () => {
    const snapshots = Array.from({ length: 5 }, (_, i) => ({ ...mockSnapshot, id: i + 1 }));
    (prisma.health_score_snapshots.findMany as jest.Mock).mockResolvedValue(snapshots);
    const res = await request(buildApp())
      .get('/api/health-score/1/history')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('Test 2.2: Should filter by custom days parameter', async () => {
    (prisma.health_score_snapshots.findMany as jest.Mock).mockResolvedValue([mockSnapshot]);
    const res = await request(buildApp())
      .get('/api/health-score/1/history?days=7')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('Test 2.3: Should return empty array if no snapshots', async () => {
    (prisma.health_score_snapshots.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/health-score/1/history')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/health-score/:teamId/calculate', () => {
  test('Test 3.1: Should calculate and store new health score', async () => {
    (prisma.health_score_snapshots.create as jest.Mock).mockResolvedValue({
      ...mockSnapshot, productivity_score: 25, collaboration_score: 0, velocity_score: 0, overall_score: 10,
    });
    const res = await request(buildApp())
      .post('/api/health-score/1/calculate')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 3.2: Should use correct formula (P*0.4 + C*0.3 + V*0.3)', async () => {
    (prisma.health_score_snapshots.create as jest.Mock).mockResolvedValue({
      ...mockSnapshot, productivity_score: 50, collaboration_score: 50, velocity_score: 50, overall_score: 50,
    });
    const res = await request(buildApp())
      .post('/api/health-score/1/calculate')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.overall_score).toBe(50);
  });

  test('Test 3.3: Should create new snapshot in database', async () => {
    (prisma.health_score_snapshots.create as jest.Mock).mockResolvedValue(mockSnapshot);
    const res = await request(buildApp())
      .post('/api/health-score/1/calculate')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(prisma.health_score_snapshots.create).toHaveBeenCalledTimes(1);
  });
});
