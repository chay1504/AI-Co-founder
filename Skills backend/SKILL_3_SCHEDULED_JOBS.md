# Backend Skill 3: Scheduled Jobs with Agenda.js

## What Are Scheduled Jobs?

A scheduled job is code that **runs automatically at set times**, without waiting for a user to trigger it.

**Example use cases:**
- "Every hour, sync Slack messages" (Passive Productivity Tracking)
- "Every day at 2 AM, calculate health score" (Health Score)
- "Every Monday, send team summary email"

Think of it like: **A timer that automatically triggers code**.

---

## Why Do We Need This?

Without scheduled jobs, you'd need to:
- Have a user manually click "sync Slack" every hour
- Have a user manually click "calculate health score" every day

With scheduled jobs:
- Everything happens automatically
- Users don't need to do anything
- Data is always fresh

---

## Installing Agenda.js

```bash
npm install agenda
npm install @types/agenda -D  # TypeScript types
```

---

## Basic Job Setup

### 1. Create Job File

```typescript
// src/jobs/slack-sync.job.ts

import { Agenda } from 'agenda';
import { prisma } from '@/utils/db';
import { slackService } from '@/services/slack.service';

export const registerSlackSyncJob = (agenda: Agenda) => {
  // Define what happens every time this job runs
  agenda.define('sync-slack-messages', async (job) => {
    try {
      console.log('🔄 Starting Slack sync job...');
      
      // Get all teams
      const teams = await prisma.teams.findMany({
        where: { is_active: true }
      });
      
      // For each team, fetch their Slack messages
      for (const team of teams) {
        try {
          console.log(`📨 Syncing Slack for team: ${team.name}`);
          
          // Call Slack API
          await slackService.syncTeamMessages(team.id);
          
          console.log(`✅ Synced Slack for ${team.name}`);
        } catch (error) {
          console.error(`❌ Failed to sync Slack for ${team.name}:`, error);
          // Continue with next team even if one fails
        }
      }
      
      console.log('✅ Slack sync job completed');
      
    } catch (error) {
      console.error('❌ Slack sync job failed:', error);
      throw error; // Agenda will retry this
    }
  });
};
```

### 2. Create Agenda Instance

```typescript
// src/jobs/scheduler.ts

import { Agenda } from 'agenda';
import { registerSlackSyncJob } from './slack-sync.job';
import { registerHealthScoreJob } from './health-score.job';
import { registerGithubSyncJob } from './github-sync.job';

let agenda: Agenda;

export const initializeScheduler = async () => {
  // Create agenda with MongoDB connection (or use memory for MVP)
  agenda = new Agenda({
    // Option 1: Use in-memory (good for MVP)
    maxConcurrency: 5,
    processEvery: '1 minute'  // Check for jobs every minute
    
    // Option 2: Use MongoDB (better for production)
    // db: { address: process.env.MONGODB_URL },
    // collection: 'scheduled_jobs'
  });
  
  // Register all jobs
  registerSlackSyncJob(agenda);
  registerHealthScoreJob(agenda);
  registerGithubSyncJob(agenda);
  
  // Schedule jobs to run
  await agenda.start();
  
  // Define schedules
  agenda.every('1 hour', 'sync-slack-messages');
  agenda.every('1 hour', 'sync-github-commits');
  agenda.every('1 day', 'calculate-health-score');
  
  console.log('✅ Scheduler initialized');
  
  return agenda;
};

export const getAgenda = () => agenda;
```

### 3. Start Scheduler in Main App

```typescript
// src/index.ts

import express from 'express';
import { initializeScheduler } from '@/jobs/scheduler';

const app = express();

// ... middleware, routes ...

// Initialize scheduler
initializeScheduler().catch(error => {
  console.error('Failed to start scheduler:', error);
  process.exit(1);
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

---

## Common Job Patterns

### Pattern 1: Hourly Sync (Slack, GitHub)

```typescript
// src/jobs/slack-sync.job.ts

export const registerSlackSyncJob = (agenda: Agenda) => {
  agenda.define('sync-slack-messages', async (job) => {
    const startTime = Date.now();
    
    try {
      const teams = await prisma.teams.findMany();
      let totalMessages = 0;
      
      for (const team of teams) {
        const slackToken = await getSlackToken(team.id);
        if (!slackToken) continue;  // Skip if no token
        
        // Get all channels
        const channels = await slackService.getChannels(slackToken);
        
        for (const channel of channels) {
          // Get messages from last hour
          const messages = await slackService.getChannelMessages(
            slackToken,
            channel.id,
            { limit: 100 }
          );
          
          // Store each message as work signal
          for (const message of messages) {
            await prisma.work_signals.create({
              data: {
                team_id: team.id,
                user_id: message.user_id,
                source: 'slack',
                signal_type: 'message',
                metadata: {
                  channel: channel.name,
                  text: message.text,
                  thread_ts: message.thread_ts
                },
                timestamp: new Date(message.ts * 1000)
              }
            });
          }
          
          totalMessages += messages.length;
        }
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Slack sync completed: ${totalMessages} messages in ${elapsed}ms`);
      
    } catch (error) {
      console.error('Slack sync failed:', error);
      throw error;
    }
  });
};

// Schedule it
agenda.every('1 hour', 'sync-slack-messages');
```

### Pattern 2: Daily Calculation (Health Score)

```typescript
// src/jobs/health-score.job.ts

export const registerHealthScoreJob = (agenda: Agenda) => {
  agenda.define('calculate-health-score', async (job) => {
    try {
      const teams = await prisma.teams.findMany();
      
      for (const team of teams) {
        // Get work signals from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const signals = await prisma.work_signals.findMany({
          where: {
            team_id: team.id,
            timestamp: { gte: sevenDaysAgo }
          }
        });
        
        // Calculate metrics
        const users = await prisma.users.count({
          where: { team_id: team.id, is_active: true }
        });
        
        const activeUsers = new Set(signals.map(s => s.user_id)).size;
        const productivity = (activeUsers / Math.max(users, 1)) * 100;
        
        // Count collaboration (cross-project messages)
        const slackMessages = signals.filter(s => s.source === 'slack').length;
        const multiProjectMessages = signals
          .filter(s => s.source === 'slack' && s.project_id)
          .length;
        const collaboration = (multiProjectMessages / Math.max(slackMessages, 1)) * 100;
        
        // Calculate velocity from projects
        const projects = await prisma.projects.findMany({
          where: { team_id: team.id }
        });
        const completed = projects.filter(p => p.status === 'completed').length;
        const total = projects.length;
        const velocity = (completed / Math.max(total, 1)) * 100;
        
        // Calculate overall score
        const overallScore = 
          (productivity * 0.4) +
          (collaboration * 0.3) +
          (velocity * 0.3);
        
        // Store snapshot
        await prisma.health_score_snapshots.create({
          data: {
            team_id: team.id,
            productivity_score: new Decimal(productivity),
            collaboration_score: new Decimal(collaboration),
            velocity_score: new Decimal(velocity),
            overall_score: new Decimal(overallScore),
            snapshot_date: new Date()
          }
        });
        
        console.log(`✅ Calculated health score for ${team.name}: ${overallScore.toFixed(1)}`);
      }
      
    } catch (error) {
      console.error('Health score calculation failed:', error);
      throw error;
    }
  });
};

// Schedule it
agenda.every('1 day', 'calculate-health-score', { startDate: new Date('2024-03-20T02:00:00Z') });
```

### Pattern 3: Manual Trigger (Force Sync)

```typescript
// src/routes/admin.ts

import { getAgenda } from '@/jobs/scheduler';

router.post('/api/admin/sync-now/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const agenda = getAgenda();
    
    // Manually trigger a job for this team
    await agenda.now('sync-slack-messages', { teamId });
    
    res.json({
      success: true,
      data: { message: 'Sync triggered' },
      error: null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to trigger sync'
    });
  }
});
```

---

## Job Configuration

### Schedules

```typescript
// Common schedule patterns

agenda.every('1 hour', 'sync-slack-messages');
// Runs every hour at :00 minutes

agenda.every('30 minutes', 'check-health');
// Runs every 30 minutes

agenda.every('1 day', 'daily-report');
// Runs once per day (at same time each day)

agenda.every('2 days', 'weekly-activity');
// Runs every 2 days

agenda.every('0 2 * * *', 'cleanup');
// Runs at 2 AM every day (cron syntax)

agenda.every('0 0 * * 1', 'weekly-sync');
// Runs every Monday at midnight (cron syntax)
```

### Job Configuration Options

```typescript
agenda.every('1 hour', 'sync-slack-messages', {
  // What time should it start running?
  startDate: new Date('2024-03-20T08:00:00Z'),
  
  // How many times max should it retry if it fails?
  maxConcurrency: 5,
  
  // Don't run this job
  skipImmediate: true
});
```

---

## Error Handling in Jobs

```typescript
agenda.define('potentially-failing-job', async (job) => {
  try {
    // Your code here
    
  } catch (error) {
    // Log the error
    console.error('Job failed:', error);
    
    // Option 1: Throw to let Agenda retry
    throw error;
    
    // Option 2: Handle gracefully without retry
    console.log('Continuing despite error...');
    // Don't throw - job succeeds but logs warning
  }
});
```

---

## Monitoring Jobs

### View Job Status

```typescript
// src/routes/admin.ts

router.get('/api/admin/jobs/status', async (req, res) => {
  const agenda = getAgenda();
  
  // Get all jobs
  const jobs = await agenda.jobs({ nextRunAt: { $ne: null } });
  
  const jobStatus = jobs.map(job => ({
    name: job.attrs.name,
    nextRun: job.attrs.nextRunAt,
    lastRun: job.attrs.lastRunAt,
    lastRunStatus: job.attrs.failReason ? 'FAILED' : 'SUCCESS'
  }));
  
  res.json({
    success: true,
    data: { jobs: jobStatus },
    error: null
  });
});
```

### Manual Job Trigger

```typescript
// src/routes/admin.ts

router.post('/api/admin/jobs/run/:jobName', async (req, res) => {
  try {
    const { jobName } = req.params;
    const agenda = getAgenda();
    
    // Run job immediately
    await agenda.now(jobName);
    
    res.json({
      success: true,
      data: { message: `Job ${jobName} triggered` },
      error: null
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      data: null,
      error: `Job ${jobName} not found`
    });
  }
});
```

---

## Common Mistakes

❌ **Don't do this:**
```typescript
// BAD: Throwing away errors
agenda.define('bad-job', async (job) => {
  const result = await someAsyncThing();
  // If someAsyncThing fails, job silently dies
});
```

✅ **Do this instead:**
```typescript
// GOOD: Handling errors properly
agenda.define('good-job', async (job) => {
  try {
    const result = await someAsyncThing();
  } catch (error) {
    console.error('Job failed:', error);
    throw error;  // Agenda will retry
  }
});
```

---

❌ **Don't do this:**
```typescript
// BAD: Job runs forever if something hangs
agenda.define('slow-job', async (job) => {
  // This might hang and never finish
  while (true) {
    await doSomething();
  }
});
```

✅ **Do this instead:**
```typescript
// GOOD: Jobs have timeout and exit properly
agenda.define('slow-job', async (job) => {
  const startTime = Date.now();
  const maxTime = 55 * 60 * 1000;  // 55 minutes (Render free tier limit)
  
  while (Date.now() - startTime < maxTime) {
    await doSomething();
  }
  
  console.log('Job completed within time limit');
});
```

---

## Testing Your Jobs

```typescript
// src/tests/slack-sync.test.ts

describe('Slack Sync Job', () => {
  it('should fetch messages from Slack', async () => {
    const agenda = getAgenda();
    
    // Run job now
    await agenda.now('sync-slack-messages');
    
    // Wait for job to complete
    await sleep(5000);
    
    // Check if work_signals were created
    const signals = await prisma.work_signals.findMany({
      where: { source: 'slack' }
    });
    
    expect(signals.length).toBeGreaterThan(0);
  });
  
  it('should handle missing Slack token gracefully', async () => {
    // Test that job doesn't crash if token is missing
    await agenda.now('sync-slack-messages');
    
    await sleep(5000);
    
    // Job should complete successfully even with no token
    const jobs = await agenda.jobs({ 'attrs.name': 'sync-slack-messages' });
    expect(jobs[0].attrs.failReason).toBeFalsy();
  });
});
```

---

## Checklist for Scheduled Jobs

- ✅ Install Agenda.js
- ✅ Define job with `agenda.define()`
- ✅ Schedule job with `agenda.every()` or `agenda.schedule()`
- ✅ Add try/catch with proper error handling
- ✅ Test job runs at scheduled time
- ✅ Add logging for debugging
- ✅ Monitor job status in admin panel
- ✅ Set reasonable timeouts

You now know how to automate your backend! 🤖

