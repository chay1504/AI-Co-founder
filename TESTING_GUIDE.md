# Backend Testing Guide - Complete Beginner's Manual

## What is Testing?

Testing is **verifying that your code works** before users see it.

Think of it like: **A car factory tests brakes, steering, and engine before selling a car.**

Without testing:
- Bugs make it to production
- Users encounter crashes
- It's hard to fix things later

---

## Types of Tests (3 Types)

### 1. Unit Tests
Test **one small piece** of code in isolation.

```
What: Does calculateHealthScore() return the right number?
Expected: Input 40, 30, 30 → Output 72 (the formula works)
```

### 2. Integration Tests
Test **multiple pieces working together**.

```
What: Does creating a user, then fetching it work?
Expected: Create user → Fetch user → Returns same user
```

### 3. End-to-End (E2E) Tests
Test **entire flows** from start to finish.

```
What: Can I log in → create a project → see it on dashboard?
Expected: Full workflow succeeds
```

**For MVP, we focus on Integration Tests** (test each API endpoint).

---

## Setting Up Testing Framework

```bash
npm install jest ts-jest @types/jest --save-dev
npm install supertest --save-dev  # For testing APIs
```

### Jest Configuration

```json
// jest.config.json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src"],
  "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  "moduleFileExtensions": ["ts", "js"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}
```

### Add to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Testing Your APIs (Most Important)

### Test 1: Create Team (POST /api/teams)

```typescript
// src/routes/__tests__/teams.test.ts

import request from 'supertest';
import express from 'express';
import { prisma } from '@/utils/db';
import teamsRouter from '@/routes/teams';

const app = express();
app.use(express.json());
app.use('/api', teamsRouter);

describe('POST /api/teams', () => {
  
  // Setup: Clear database before each test
  beforeEach(async () => {
    await prisma.teams.deleteMany();
  });
  
  // Test 1a: Should create team with valid data
  it('should create a team with valid data', async () => {
    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({
        name: 'Engineering',
        slug: 'eng'
      });
    
    // Expectations
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe('Engineering');
    expect(response.body.error).toBe(null);
  });
  
  // Test 1b: Should reject if name is missing
  it('should reject if name is missing', async () => {
    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({
        slug: 'eng'
        // Missing: name
      });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });
  
  // Test 1c: Should reject without JWT token
  it('should reject without JWT token', async () => {
    const response = await request(app)
      .post('/api/teams')
      .send({
        name: 'Engineering',
        slug: 'eng'
      });
      // No .set('Authorization', ...)
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('token');
  });
  
  // Test 1d: Should reject duplicate slug
  it('should reject duplicate slug', async () => {
    // Create first team
    await request(app)
      .post('/api/teams')
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({ name: 'Engineering', slug: 'eng' });
    
    // Try to create second with same slug
    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({ name: 'Design', slug: 'eng' });
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
  
});
```

### Test 2: Get Team (GET /api/teams/:id)

```typescript
describe('GET /api/teams/:id', () => {
  
  beforeEach(async () => {
    await prisma.teams.deleteMany();
  });
  
  // Test 2a: Should fetch existing team
  it('should fetch an existing team', async () => {
    // Setup: Create a team first
    const team = await prisma.teams.create({
      data: {
        name: 'Engineering',
        slug: 'eng',
        company_id: 'company_1'
      }
    });
    
    // Test: Fetch it
    const response = await request(app)
      .get(`/api/teams/${team.id}`)
      .set('Authorization', 'Bearer valid_jwt_token');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(team.id);
    expect(response.body.data.name).toBe('Engineering');
  });
  
  // Test 2b: Should return 404 for non-existent team
  it('should return 404 for non-existent team', async () => {
    const response = await request(app)
      .get('/api/teams/9999')  // Non-existent ID
      .set('Authorization', 'Bearer valid_jwt_token');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not found');
  });
  
  // Test 2c: Should reject invalid ID format
  it('should reject invalid ID format', async () => {
    const response = await request(app)
      .get('/api/teams/not-a-number')
      .set('Authorization', 'Bearer valid_jwt_token');
    
    expect(response.status).toBe(400);
  });
  
});
```

### Test 3: Update Team (PATCH /api/teams/:id)

```typescript
describe('PATCH /api/teams/:id', () => {
  
  beforeEach(async () => {
    await prisma.teams.deleteMany();
  });
  
  it('should update team name', async () => {
    // Setup
    const team = await prisma.teams.create({
      data: {
        name: 'Engineering',
        slug: 'eng',
        company_id: 'company_1'
      }
    });
    
    // Test
    const response = await request(app)
      .patch(`/api/teams/${team.id}`)
      .set('Authorization', 'Bearer valid_jwt_token')
      .send({ name: 'Backend Team' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Backend Team');
    
    // Verify in database
    const updated = await prisma.teams.findUnique({
      where: { id: team.id }
    });
    expect(updated.name).toBe('Backend Team');
  });
  
});
```

### Test 4: Delete Team (DELETE /api/teams/:id)

```typescript
describe('DELETE /api/teams/:id', () => {
  
  beforeEach(async () => {
    await prisma.teams.deleteMany();
  });
  
  it('should delete a team', async () => {
    // Setup
    const team = await prisma.teams.create({
      data: {
        name: 'Engineering',
        slug: 'eng',
        company_id: 'company_1'
      }
    });
    
    // Test
    const response = await request(app)
      .delete(`/api/teams/${team.id}`)
      .set('Authorization', 'Bearer valid_jwt_token');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Verify deleted from database
    const deleted = await prisma.teams.findUnique({
      where: { id: team.id }
    });
    expect(deleted).toBeNull();
  });
  
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests matching a pattern
npm test -- teams.test.ts

# Run tests in watch mode (re-run on file change)
npm test -- --watch

# Run with coverage report
npm test -- --coverage
```

---

## What to Test (Checklist)

For **each endpoint**, test:

- ✅ **Valid input** → Returns 200 with correct data
- ✅ **Missing required field** → Returns 400
- ✅ **Invalid data type** → Returns 400
- ✅ **No JWT token** → Returns 401
- ✅ **Invalid JWT token** → Returns 401
- ✅ **Non-existent resource** → Returns 404
- ✅ **Duplicate unique constraint** → Returns 400

For **each scheduled job**, test:

- ✅ **Runs at scheduled time** → Completes successfully
- ✅ **Missing API token** → Handles gracefully
- ✅ **API error** → Logs error and doesn't crash
- ✅ **Correct data stored** → Database has expected records

---

## Manual Testing (Without Code)

If you want to test without writing tests, use **Postman** or **curl**:

### Using curl (Terminal)

```bash
# GET /api/teams/1
curl -X GET "http://localhost:3001/api/teams/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# POST /api/teams
curl -X POST "http://localhost:3001/api/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Engineering","slug":"eng"}'

# PATCH /api/teams/1
curl -X PATCH "http://localhost:3001/api/teams/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Backend Team"}'

# DELETE /api/teams/1
curl -X DELETE "http://localhost:3001/api/teams/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman (GUI)

1. **Download Postman** from postman.com
2. **Create new request**
3. **Set method** (GET, POST, etc.)
4. **Enter URL** (e.g., http://localhost:3001/api/teams/1)
5. **Add headers**:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
6. **Add body** (for POST/PATCH):
   - Set to JSON
   - Paste `{"name":"Engineering"}`
7. **Click Send**
8. **Check response** in bottom panel

---

## Database Testing: Reset Between Tests

```typescript
// src/tests/setup.ts

import { prisma } from '@/utils/db';

// Reset all tables before each test
beforeEach(async () => {
  // Delete in order (respecting foreign keys)
  await prisma.work_signals.deleteMany();
  await prisma.blockers.deleteMany();
  await prisma.health_score_snapshots.deleteMany();
  await prisma.project_dependencies.deleteMany();
  await prisma.projects.deleteMany();
  await prisma.users.deleteMany();
  await prisma.teams.deleteMany();
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## Common Test Patterns

### Pattern 1: Setup → Action → Assert

```typescript
it('should do something', async () => {
  // SETUP: Create test data
  const team = await prisma.teams.create({
    data: { name: 'Test Team', slug: 'test' }
  });
  
  // ACTION: Do the thing
  const response = await request(app)
    .get(`/api/teams/${team.id}`)
    .set('Authorization', 'Bearer token');
  
  // ASSERT: Check results
  expect(response.status).toBe(200);
  expect(response.body.data.name).toBe('Test Team');
});
```

### Pattern 2: Error Cases

```typescript
it('should handle errors gracefully', async () => {
  const response = await request(app)
    .get('/api/teams/invalid-id')
    .set('Authorization', 'Bearer token');
  
  // Don't expect the response to throw an error
  // Expect it to return error status code
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});
```

### Pattern 3: Verify Database State

```typescript
it('should actually save to database', async () => {
  const response = await request(app)
    .post('/api/teams')
    .set('Authorization', 'Bearer token')
    .send({ name: 'Test', slug: 'test' });
  
  // Check database directly
  const savedTeam = await prisma.teams.findFirst({
    where: { slug: 'test' }
  });
  
  expect(savedTeam).not.toBeNull();
  expect(savedTeam.name).toBe('Test');
});
```

---

## Testing Checklist

### Before You Deploy

- ✅ All endpoints return correct status codes
- ✅ All validation errors return 400
- ✅ All protected endpoints return 401 without token
- ✅ All 404 scenarios handled
- ✅ Database operations work (create, read, update, delete)
- ✅ Relationships work (getting team with users, etc)
- ✅ Scheduled jobs run successfully
- ✅ Error handling doesn't crash server
- ✅ Performance is acceptable (< 500ms response time)
- ✅ No console errors or warnings

---

## Running Full Test Suite

```bash
# Run all tests with coverage
npm test -- --coverage

# Output should show:
# ✓ teams.test.ts (20 passed)
# ✓ users.test.ts (15 passed)
# ✓ projects.test.ts (18 passed)
# ✓ health-score.test.ts (12 passed)
# ✓ jobs.test.ts (8 passed)
# Total: 73 passed

# Coverage report:
# Statements   : 92% ( 230/250 )
# Branches     : 88% ( 35/40 )
# Functions    : 90% ( 45/50 )
# Lines        : 93% ( 220/235 )
```

---

## Debugging Failed Tests

If a test fails:

```typescript
// Step 1: Add console.log to see what's happening
it('should fail test', async () => {
  console.log('Starting test...');
  const response = await request(app)
    .get('/api/teams/1')
    .set('Authorization', 'Bearer token');
  
  console.log('Response status:', response.status);
  console.log('Response body:', JSON.stringify(response.body, null, 2));
  
  expect(response.status).toBe(200);
});

// Step 2: Run just this test
npm test -- --testNamePattern="should fail test"

// Step 3: Check console output to see what went wrong
```

---

## Example: Full Test File

```typescript
// src/routes/__tests__/health-score.test.ts

import request from 'supertest';
import express from 'express';
import { prisma } from '@/utils/db';
import healthScoreRouter from '@/routes/health-score';

const app = express();
app.use(express.json());
app.use('/api', healthScoreRouter);

describe('Health Score API', () => {
  
  beforeEach(async () => {
    await prisma.health_score_snapshots.deleteMany();
    await prisma.teams.deleteMany();
  });
  
  describe('GET /api/health-score/:teamId', () => {
    
    it('should return current health score', async () => {
      // Setup
      const team = await prisma.teams.create({
        data: {
          name: 'Test Team',
          slug: 'test',
          company_id: 'company_1'
        }
      });
      
      await prisma.health_score_snapshots.create({
        data: {
          team_id: team.id,
          productivity_score: 80,
          collaboration_score: 65,
          velocity_score: 70,
          overall_score: 71.5,
          snapshot_date: new Date()
        }
      });
      
      // Test
      const response = await request(app)
        .get(`/api/health-score/${team.id}`)
        .set('Authorization', 'Bearer token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overall_score).toBe(71.5);
      expect(response.body.data.productivity_score).toBe(80);
    });
    
    it('should return default score if no snapshots', async () => {
      const team = await prisma.teams.create({
        data: {
          name: 'New Team',
          slug: 'new',
          company_id: 'company_1'
        }
      });
      
      const response = await request(app)
        .get(`/api/health-score/${team.id}`)
        .set('Authorization', 'Bearer token');
      
      expect(response.status).toBe(200);
      expect(response.body.data.overall_score).toBe(0);
    });
    
  });
  
});
```

---

## You're Ready!

You now know how to:
- ✅ Write tests for every endpoint
- ✅ Run tests to verify code works
- ✅ Debug when tests fail
- ✅ Ensure quality before deploying

**Test everything before going to production!** 🧪

