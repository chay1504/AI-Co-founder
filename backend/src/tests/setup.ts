// src/tests/setup.ts
import { jest } from '@jest/globals';
// Global test setup – all jest.mock() calls here are hoisted automatically

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: (jest as any).fn().mockResolvedValue({
    session_id: 'test_session',
    user_id: 'test_user_id',
  }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    teams: {
      create: (jest as any).fn(),
      findUnique: (jest as any).fn(),
      update: (jest as any).fn(),
      findMany: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
    },
    users: {
      create: (jest as any).fn(),
      findUnique: (jest as any).fn(),
      update: (jest as any).fn(),
      findMany: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
      count: (jest as any).fn().mockResolvedValue(0),
    },
    projects: {
      create: (jest as any).fn(),
      findUnique: (jest as any).fn(),
      update: (jest as any).fn(),
      findMany: (jest as any).fn(),
      delete: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
    },
    project_dependencies: {
      create: (jest as any).fn(),
      delete: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
    },
    blockers: {
      create: (jest as any).fn(),
      findUnique: (jest as any).fn(),
      update: (jest as any).fn(),
      findMany: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
    },
    work_signals: {
      create: (jest as any).fn(),
      findMany: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
      groupBy: (jest as any).fn().mockResolvedValue([]),
    },
    health_score_snapshots: {
      create: (jest as any).fn(),
      findFirst: (jest as any).fn(),
      findMany: (jest as any).fn(),
      deleteMany: (jest as any).fn(),
    },
    $disconnect: (jest as any).fn(),
  },
}));

jest.mock('@/jobs/scheduler', () => ({
  initializeScheduler: (jest as any).fn().mockResolvedValue(undefined),
  getAgenda: (jest as any).fn().mockReturnValue({
    now: (jest as any).fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/services/slack.service', () => ({
  slackService: {
    getConnectUrl: (jest as any).fn().mockResolvedValue('https://slack.com/oauth/authorize?client_id=test&scope=test'),
    handleCallback: (jest as any).fn().mockResolvedValue({ message: 'Slack integrated successfully' }),
  },
}));

jest.mock('@/services/github.service', () => ({
  githubService: {
    connectAccount: (jest as any).fn().mockResolvedValue({ github_username: 'test-user' }),
    fetchCommits: (jest as any).fn().mockResolvedValue([]),
  },
}));
