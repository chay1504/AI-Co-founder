// src/routes/__tests__/users.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    users: {
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
import usersRouter from '@/routes/users';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', usersRouter);
  app.use(errorHandler);
  return app;
}

const mockUser = {
  id: 1,
  team_id: 1,
  email: 'alice@company.com',
  full_name: 'Alice',
  role: 'engineer',
  slack_user_id: null,
  github_username: null,
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2024-01-01T00:00:00Z').toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
});

describe('POST /api/users', () => {
  test('Test 1.1: Should create user with valid data', async () => {
    (prisma.users.create as jest.Mock).mockResolvedValue(mockUser);
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, email: 'alice@company.com', full_name: 'Alice', role: 'engineer' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  test('Test 1.2: Should reject missing team_id', async () => {
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ email: 'alice@company.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.3: Should reject missing email', async () => {
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.4: Should handle duplicate email DB error', async () => {
    (prisma.users.create as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Unique constraint'), { code: 'P2002' })
    );
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, email: 'alice@company.com' });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.5: Should handle email without format validation at route level', async () => {
    (prisma.users.create as jest.Mock).mockResolvedValue({ ...mockUser, email: 'not-an-email' });
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, email: 'not-an-email' });
    expect([200, 400]).toContain(res.status);
  });

  test('Test 1.6: Should reject without JWT', async () => {
    const res = await request(buildApp()).post('/api/users').send({ team_id: 1, email: 'alice@company.com' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Test 1.7: Should auto-set is_active to true', async () => {
    (prisma.users.create as jest.Mock).mockResolvedValue({ ...mockUser, is_active: true });
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, email: 'alice@company.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });

  test('Test 1.8: Should handle null full_name', async () => {
    (prisma.users.create as jest.Mock).mockResolvedValue({ ...mockUser, full_name: null });
    const res = await request(buildApp())
      .post('/api/users')
      .set('Authorization', VALID_JWT)
      .send({ team_id: 1, email: 'alice@company.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBeNull();
  });
});

describe('GET /api/users/:id', () => {
  test('Test 2.1: Should fetch existing user', async () => {
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(mockUser);
    const res = await request(buildApp())
      .get('/api/users/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 2.2: Should return 404 for non-existent user', async () => {
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/users/9999')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  test('Test 2.3: Should reject without JWT', async () => {
    const res = await request(buildApp()).get('/api/users/1');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/users/:id', () => {
  test('Test 3.1: Should update user name', async () => {
    (prisma.users.update as jest.Mock).mockResolvedValue({ ...mockUser, full_name: 'Alice Smith' });
    const res = await request(buildApp())
      .patch('/api/users/1')
      .set('Authorization', VALID_JWT)
      .send({ full_name: 'Alice Smith' });
    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBe('Alice Smith');
  });

  test('Test 3.2: Should update role', async () => {
    (prisma.users.update as jest.Mock).mockResolvedValue({ ...mockUser, role: 'lead' });
    const res = await request(buildApp())
      .patch('/api/users/1')
      .set('Authorization', VALID_JWT)
      .send({ role: 'lead' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('lead');
  });

  test('Test 3.3: Should link Slack user ID', async () => {
    (prisma.users.update as jest.Mock).mockResolvedValue({ ...mockUser, slack_user_id: 'U12345' });
    const res = await request(buildApp())
      .patch('/api/users/1')
      .set('Authorization', VALID_JWT)
      .send({ slack_user_id: 'U12345' });
    expect(res.status).toBe(200);
    expect(res.body.data.slack_user_id).toBe('U12345');
  });

  test('Test 3.4: Should link GitHub username', async () => {
    (prisma.users.update as jest.Mock).mockResolvedValue({ ...mockUser, github_username: 'alice-dev' });
    const res = await request(buildApp())
      .patch('/api/users/1')
      .set('Authorization', VALID_JWT)
      .send({ github_username: 'alice-dev' });
    expect(res.status).toBe(200);
    expect(res.body.data.github_username).toBe('alice-dev');
  });

  test('Test 3.5: Should return error for non-existent user', async () => {
    (prisma.users.update as jest.Mock).mockRejectedValue(new Error('Record not found'));
    const res = await request(buildApp())
      .patch('/api/users/9999')
      .set('Authorization', VALID_JWT)
      .send({ full_name: 'X' });
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/users/:id', () => {
  test('Test 4.1: Should soft delete user', async () => {
    (prisma.users.update as jest.Mock).mockResolvedValue({ ...mockUser, is_active: false });
    const res = await request(buildApp())
      .delete('/api/users/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
  });

  test('Test 4.2: Should return error for non-existent user', async () => {
    (prisma.users.update as jest.Mock).mockRejectedValue(new Error('Record not found'));
    const res = await request(buildApp())
      .delete('/api/users/9999')
      .set('Authorization', VALID_JWT);
    expect([404, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('Test 4.3: Should reject without JWT', async () => {
    const res = await request(buildApp()).delete('/api/users/1');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/team/:teamId', () => {
  test('Test 5.1: Should return all active users for team', async () => {
    const users = [
      { ...mockUser, id: 1 },
      { ...mockUser, id: 2, email: 'b@c.com' },
      { ...mockUser, id: 3, email: 'c@c.com' },
    ];
    (prisma.users.findMany as jest.Mock).mockResolvedValue(users);
    const res = await request(buildApp())
      .get('/api/users/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test('Test 5.2: Should return empty array for team with no active users', async () => {
    (prisma.users.findMany as jest.Mock).mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/users/team/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
