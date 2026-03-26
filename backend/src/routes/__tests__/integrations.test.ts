// src/routes/__tests__/integrations.test.ts

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' }),
}));

jest.mock('@/utils/db', () => ({
  prisma: { $disconnect: jest.fn() },
}));

jest.mock('@/jobs/scheduler', () => ({
  initializeScheduler: jest.fn(),
  getAgenda: jest.fn().mockReturnValue({ now: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock('@/services/slack.service', () => ({
  slackService: {
    getConnectUrl: jest.fn().mockResolvedValue('https://slack.com/oauth/authorize?client_id=test&scope=test'),
    handleCallback: jest.fn().mockResolvedValue({ message: 'Slack integrated successfully' }),
  },
}));

jest.mock('@/services/github.service', () => ({
  githubService: {
    connectAccount: jest.fn().mockResolvedValue({ github_username: 'test-user' }),
    fetchCommits: jest.fn().mockResolvedValue([]),
  },
}));

import request from 'supertest';
import express from 'express';
import { verifyClerkToken } from '@/utils/clerk';
import { slackService } from '@/services/slack.service';
import { githubService } from '@/services/github.service';
import integrationsRouter from '@/routes/integrations';
import { errorHandler } from '@/middleware/errorHandler';

const VALID_JWT = 'Bearer mock_jwt_token_valid';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', integrationsRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  (verifyClerkToken as jest.Mock).mockResolvedValue({ session_id: 'test_session', user_id: 'test_user_id' });
  (slackService.getConnectUrl as jest.Mock).mockResolvedValue('https://slack.com/oauth/authorize?client_id=test&scope=test');
  (slackService.handleCallback as jest.Mock).mockResolvedValue({ message: 'Slack integrated successfully' });
  (githubService.connectAccount as jest.Mock).mockResolvedValue({ github_username: 'test-user' });
  const { getAgenda } = require('@/jobs/scheduler');
  (getAgenda as jest.Mock).mockReturnValue({ now: jest.fn().mockResolvedValue(undefined) });
});

// ─── Slack Integration ────────────────────────────────────────────────────────

describe('Slack Integration', () => {
  test('Test 1.1: Should return Slack OAuth URL', async () => {
    const res = await request(buildApp())
      .post('/api/integrations/slack/connect')
      .set('Authorization', VALID_JWT)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toContain('slack.com');
  });

  test('Test 1.2: Should handle Slack OAuth callback', async () => {
    const res = await request(buildApp())
      .post('/api/integrations/slack/callback')
      .set('Authorization', VALID_JWT)
      .send({ code: 'abc123', teamId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Test 1.3: Should reject without JWT', async () => {
    const res = await request(buildApp())
      .post('/api/integrations/slack/callback')
      .send({ code: 'abc123', teamId: 1 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── GitHub Integration ───────────────────────────────────────────────────────

describe('GitHub Integration', () => {
  test('Test 2.1: Should connect GitHub account with PAT', async () => {
    (githubService.connectAccount as jest.Mock).mockResolvedValue({ id: 1, github_username: 'alice-dev' });
    const res = await request(buildApp())
      .post('/api/integrations/github/connect')
      .set('Authorization', VALID_JWT)
      .send({ pat: 'ghp_validtoken123', userId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.github_username).toBe('alice-dev');
  });

  test('Test 2.2: Should return 500 for invalid PAT (service throws)', async () => {
    (githubService.connectAccount as jest.Mock).mockRejectedValue(new Error('Bad credentials'));
    const res = await request(buildApp())
      .post('/api/integrations/github/connect')
      .set('Authorization', VALID_JWT)
      .send({ pat: 'invalid_token', userId: 1 });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// ─── Integration Status & Manual Sync ────────────────────────────────────────

describe('Integration Status & Manual Sync', () => {
  test('Test 3.1: Should return integration status', async () => {
    const res = await request(buildApp())
      .get('/api/integrations/status/1')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('slack');
    expect(res.body.data).toHaveProperty('github');
  });

  test('Test 3.2: Should trigger manual sync', async () => {
    const res = await request(buildApp())
      .post('/api/integrations/sync/manual/1')
      .set('Authorization', VALID_JWT)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/sync jobs triggered/i);
  });

  test('Test 3.3: Should reject without JWT', async () => {
    const res = await request(buildApp()).get('/api/integrations/status/1');
    expect(res.status).toBe(401);
  });
});

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

describe('Admin Endpoints', () => {
  test('Test 4.1: Should trigger all sync jobs', async () => {
    const res = await request(buildApp())
      .post('/api/admin/sync-all-teams')
      .set('Authorization', VALID_JWT)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/all sync jobs triggered/i);
  });

  test('Test 4.2: Should get job logs', async () => {
    const res = await request(buildApp())
      .get('/api/admin/logs')
      .set('Authorization', VALID_JWT);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
  });

  test('Test 4.3: Should reject without JWT on admin endpoints', async () => {
    const res = await request(buildApp()).post('/api/admin/sync-all-teams').send({});
    expect(res.status).toBe(401);
  });
});
