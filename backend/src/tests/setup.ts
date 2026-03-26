// src/tests/setup.ts
// Global test setup – all jest.mock() calls here are hoisted automatically

jest.mock('@/utils/clerk', () => ({
  verifyClerkToken: jest.fn().mockResolvedValue({
    session_id: 'test_session',
    user_id: 'test_user_id',
  }),
}));

jest.mock('@/utils/db', () => ({
  prisma: {
    teams: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    users: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    projects: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    project_dependencies: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    blockers: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    work_signals: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    health_score_snapshots: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('@/jobs/scheduler', () => ({
  initializeScheduler: jest.fn().mockResolvedValue(undefined),
  getAgenda: jest.fn().mockReturnValue({
    now: jest.fn().mockResolvedValue(undefined),
  }),
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
