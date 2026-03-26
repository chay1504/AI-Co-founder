// src/routes/__tests__/workSignals.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    work_signals: {
      create: jest.fn(),
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
import workSignalsRouter from '@/routes/workSignals';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', workSignalsRouter);
  app.use(errorHandler);
  return app;
}

const mockSignal = {
  id: 1,
  team_id: 1,
  user_id: 1,
  source: 'slack',
  signal_type: 'message',
  project_id: null,
  metadata: { channel: '#eng' },
  timestamp: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

describe('POST /api/work-signals', () => {
  test('Test 1.1: Should create work signal with valid data', async () => {
    (prisma.work_signals.create as jest.Mock).mockResolvedValue(mockSignal);
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, user_id: 1, source: 'slack', signal_type: 'message', metadata: { channel: '#eng' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 1.2: Should reject missing team_id', async () => {
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ user_id: 1, source: 'slack' });
    expect(res.status).toBe(400);
  });

  test('Test 1.3: Should reject missing user_id', async () => {
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, source: 'slack' });
    expect(res.status).toBe(400);
  });

  test('Test 1.4: Should reject missing source', async () => {
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, user_id: 1 });
    expect(res.status).toBe(400);
  });

  test('Test 1.5: Should handle metadata (flexible JSON)', async () => {
    const complexMeta = { channel: '#eng', thread_ts: '1234.567', mentions: ['alice', 'bob'] };
    (prisma.work_signals.create as jest.Mock).mockResolvedValue({ ...mockSignal, metadata: complexMeta });
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, user_id: 1, source: 'slack', metadata: complexMeta });
    expect(res.status).toBe(200);
    expect(res.body.data.metadata).toEqual(complexMeta);
  });

  test('Test 1.6: Should auto-set timestamp to now', async () => {
    const before = Date.now();
    const now = new Date();
    (prisma.work_signals.create as jest.Mock).mockResolvedValue({ ...mockSignal, timestamp: now.toISOString() });
    const res = await request(buildApp())
      .post('/api/work-signals')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, user_id: 1, source: 'slack' });
    const after = Date.now();
    expect(res.status).toBe(200);
    const ts = new Date(res.body.data.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before - 5000);
    expect(ts).toBeLessThanOrEqual(after + 5000);
  });

  test('Test 1.7: Should reject without JWT', async () => {
    const res = await request(buildApp()).post('/api/work-signals').send({ team_id: 1, user_id: 1, source: 'slack' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/work-signals/user/:userId', () => {
  test('Test 2.1: Should return all signals for user', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([
      mockSignal, { ...mockSignal, id: 2 }, { ...mockSignal, id: 3 }
    ]);
    const res = await request(buildApp())
      .get('/api/work-signals/user/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 2.2: Should return empty array if no signals', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/work-signals/user/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/work-signals/project/:projectId', () => {
  test('Test 3.1: Should return all signals for project', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([
      mockSignal, { ...mockSignal, id: 2 }, { ...mockSignal, id: 3 }
    ]);
    const res = await request(buildApp())
      .get('/api/work-signals/project/5')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 3.2: Should return empty array if no signals', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/work-signals/project/5')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/work-signals/team/:teamId', () => {
  const t2 = new Date('2024-02-01T00:00:00Z');
  const t3 = new Date('2024-03-01T00:00:00Z');

  test('Test 4.1: Should return all signals for team', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ ...mockSignal, id: i + 1 }))
    );
    const res = await request(buildApp())
      .get('/api/work-signals/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('Test 4.2: Should filter by from date', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([
      { ...mockSignal, id: 2, timestamp: t2.toISOString() },
      { ...mockSignal, id: 3, timestamp: t3.toISOString() },
    ]);
    const res = await request(buildApp())
      .get(`/api/work-signals/team/1?from=${t2.toISOString()}`)
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('Test 4.3: Should filter by to date', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([
      { ...mockSignal, id: 1, timestamp: new Date('2024-01-01').toISOString() },
      { ...mockSignal, id: 2, timestamp: t2.toISOString() },
    ]);
    const res = await request(buildApp())
      .get(`/api/work-signals/team/1?to=${t3.toISOString()}`)
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('Test 4.4: Should filter by date range', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([
      { ...mockSignal, id: 2, timestamp: t2.toISOString() },
      { ...mockSignal, id: 3, timestamp: t3.toISOString() },
    ]);
    const res = await request(buildApp())
      .get(`/api/work-signals/team/1?from=${t2.toISOString()}&to=${t3.toISOString()}`)
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('Test 4.5: Should return empty if no signals match', async () => {
    (prisma.work_signals.findMany as jest.Mock).mockResolvedValue([]);
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
    const res = await request(buildApp())
      .get(`/api/work-signals/team/1?from=${futureDate}`)
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
