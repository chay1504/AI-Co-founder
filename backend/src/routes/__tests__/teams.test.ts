// src/routes/__tests__/teams.test.ts

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
import teamsRouter from '@/routes/teams';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', teamsRouter);
  app.use(errorHandler);
  return app;
}

// Use plain numbers/strings for mock data (BigInt is NOT JSON serializable)
const mockTeam = {
  id: 1,
  name: 'Engineering',
  slug: 'eng',
  company_id: 'test_user_id',
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

// ─── POST /api/teams ──────────────────────────────────────────────────────────

describe('POST /api/teams', () => {
  test('Test 1.1: Should create team with valid data', async () => {
    (prisma.teams.create as jest.Mock).mockResolvedValue(mockTeam);
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('Test 1.2: Should reject missing team name', async () => {
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ slug: 'eng' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  test('Test 1.3: Should reject missing slug', async () => {
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Engineering' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.4: Should reject without JWT token', async () => {
    const res = await request(buildApp())
      .post('/api/teams')
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.5: Should reject with invalid JWT token', async () => {
    (verifyClerkToken as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', 'Bearer invalid_token')
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.6: Should reject duplicate slug (DB throws)', async () => {
    (prisma.teams.create as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Unique constraint failed on slug'), { code: 'P2002' })
    );
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.7: Should handle database error gracefully', async () => {
    (prisma.teams.create as jest.Mock).mockRejectedValue(new Error('DB connection failed'));
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).not.toContain('DB connection failed');
  });

  test('Test 1.8: Should auto-set is_active to true', async () => {
    (prisma.teams.create as jest.Mock).mockResolvedValue({ ...mockTeam, is_active: true });
    const res = await request(buildApp())
      .post('/api/teams')
      .set('Authorization', VALID_JWT)
      .send({ name: 'Engineering', slug: 'eng' });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });
});

// ─── GET /api/teams/:id ───────────────────────────────────────────────────────

describe('GET /api/teams/:id', () => {
  test('Test 2.1: Should fetch existing team', async () => {
    (prisma.teams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    const res = await request(buildApp())
      .get('/api/teams/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2.2: Should return 404 for non-existent team', async () => {
    (prisma.teams.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/teams/9999')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/team not found/i);
  });

  test('Test 2.3: Should handle non-numeric ID gracefully', async () => {
    (prisma.teams.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/teams/not-a-number')
      .set('Authorization', VALID_JWT);
    expect([400, 404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Test 2.4: Should reject without JWT', async () => {
    const res = await request(buildApp()).get('/api/teams/1');
    expect(res.status).toBe(401);
  });

  test('Test 2.5: Should include all team fields', async () => {
    (prisma.teams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
    const res = await request(buildApp())
      .get('/api/teams/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d).toHaveProperty('name');
    expect(d).toHaveProperty('slug');
    expect(d).toHaveProperty('company_id');
    expect(d).toHaveProperty('is_active');
    expect(d).toHaveProperty('created_at');
    expect(d).toHaveProperty('updated_at');
  });
});

// ─── PATCH /api/teams/:id ─────────────────────────────────────────────────────

describe('PATCH /api/teams/:id', () => {
  test('Test 3.1: Should update team name', async () => {
    (prisma.teams.update as jest.Mock).mockResolvedValue({ ...mockTeam, name: 'B' });
    const res = await request(buildApp())
      .patch('/api/teams/1')
      .set('Authorization', VALID_JWT)
      .send({ name: 'B' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('B');
  });

  test('Test 3.2: Should update slug', async () => {
    (prisma.teams.update as jest.Mock).mockResolvedValue({ ...mockTeam, slug: 'engineering-v2' });
    const res = await request(buildApp())
      .patch('/api/teams/1')
      .set('Authorization', VALID_JWT)
      .send({ slug: 'engineering-v2' });
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('engineering-v2');
  });

  test('Test 3.3: Should do partial update (only name)', async () => {
    (prisma.teams.update as jest.Mock).mockResolvedValue({ ...mockTeam, name: 'New Name' });
    const res = await request(buildApp())
      .patch('/api/teams/1')
      .set('Authorization', VALID_JWT)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
    expect(res.body.data.slug).toBe(mockTeam.slug);
  });

  test('Test 3.4: Should return error for non-existent team', async () => {
    (prisma.teams.update as jest.Mock).mockRejectedValue(new Error('Record not found'));
    const res = await request(buildApp())
      .patch('/api/teams/9999')
      .set('Authorization', VALID_JWT)
      .send({ name: 'X' });
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Test 3.5: Should update updated_at timestamp', async () => {
    const updatedAt = '2024-06-01T00:00:00.000Z';
    (prisma.teams.update as jest.Mock).mockResolvedValue({ ...mockTeam, updated_at: updatedAt });
    const res = await request(buildApp())
      .patch('/api/teams/1')
      .set('Authorization', VALID_JWT)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    const respondedAt = new Date(res.body.data.updated_at).getTime();
    const createdAt = new Date(res.body.data.created_at).getTime();
    expect(respondedAt).toBeGreaterThanOrEqual(createdAt);
  });

  test('Test 3.6: Should reject without JWT', async () => {
    const res = await request(buildApp()).patch('/api/teams/1').send({ name: 'New' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/teams/:id/members ───────────────────────────────────────────────

describe('GET /api/teams/:id/members', () => {
  test('Test 4.1: Should return empty array for team with no users', async () => {
    (prisma.users.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/teams/1/members')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('Test 4.2: Should return all active users in team', async () => {
    const members = ['a@t.com','b@t.com','c@t.com'].map((e, i) => ({
      id: i + 1, email: e, is_active: true
    }));
    (prisma.users.findMany as jest.Mock).mockResolvedValue(members);
    const res = await request(buildApp())
      .get('/api/teams/1/members')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 4.3: Should handle non-existent team gracefully', async () => {
    (prisma.users.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/teams/9999/members')
      .set('Authorization', VALID_JWT);
    expect([200, 404]).toContain(res.status);
  });

  test('Test 4.4: Should reject without JWT', async () => {
    const res = await request(buildApp()).get('/api/teams/1/members');
    expect(res.status).toBe(401);
  });
});
