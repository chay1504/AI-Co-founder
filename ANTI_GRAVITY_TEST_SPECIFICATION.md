# COMPLETE TEST SPECIFICATION FOR ANTI-GRAVITY
## Write All 60+ Jest Tests for AI Co-Founder Backend

**For**: Anti-Gravity (AI Code Generator)  
**Task**: Generate comprehensive Jest + Supertest test files for the entire backend  
**Output**: Test files + Test Results Report (MD file)  
**Timeline**: Can be done in one generation pass  

---

## YOUR JOB (Simple)

1. Copy this ENTIRE document
2. Paste into Anti-Gravity
3. Wait for it to generate test files
4. Run: `npm test`
5. Share the results with me
6. I'll review and tell you next steps

---

## ANTI-GRAVITY: WRITE ALL THESE TESTS

### INSTRUCTIONS

You are a senior test engineer. Write comprehensive Jest tests for the AI Co-Founder backend.

**Requirements**:
- Write in TypeScript
- Use Jest + Supertest
- Test ALL 35 API endpoints
- Test ALL error cases
- Test database operations
- Test scheduled jobs
- ALL tests must PASS
- Create test setup/teardown
- Use mocked database for tests
- Output: Test files ready to run with `npm test`

---

## TEST REQUIREMENTS (Detailed Specification)

### Test Framework Setup

```typescript
// All test files use this pattern:
import request from 'supertest';
import express from 'express';
import { prisma } from '@/utils/db';

// Mock Clerk JWT
const mockJWT = 'Bearer mock_jwt_token_valid';

// Setup/Teardown
beforeAll(async () => {
  // Connect to test database
});

beforeEach(async () => {
  // Clear all tables
  await prisma.work_signals.deleteMany();
  await prisma.blockers.deleteMany();
  await prisma.health_score_snapshots.deleteMany();
  await prisma.project_dependencies.deleteMany();
  await prisma.projects.deleteMany();
  await prisma.users.deleteMany();
  await prisma.teams.deleteMany();
});

afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect();
});
```

---

## TEST FILE 1: TEAMS ENDPOINT TESTS (20 tests)

**File**: `src/routes/__tests__/teams.test.ts`

### Test Suite: POST /api/teams (Create Team)

```
Test 1.1: Should create team with valid data
- Send: { name: "Engineering", slug: "eng" }
- Expect: 200, success: true, team object with id

Test 1.2: Should reject missing team name
- Send: { slug: "eng" } (no name)
- Expect: 400, success: false, error message

Test 1.3: Should reject missing slug
- Send: { name: "Engineering" } (no slug)
- Expect: 400, success: false, error message

Test 1.4: Should reject without JWT token
- Send request WITHOUT Authorization header
- Expect: 401, success: false, error about token

Test 1.5: Should reject with invalid JWT token
- Send: Authorization: "Bearer invalid_token"
- Expect: 401, success: false, error about invalid token

Test 1.6: Should reject duplicate slug
- Create team 1 with slug "eng"
- Try to create team 2 with slug "eng"
- Expect: 400, success: false, error about duplicate

Test 1.7: Should handle database error gracefully
- Mock prisma.teams.create to throw error
- Expect: 500, success: false, generic error message (not exposing internal error)

Test 1.8: Should auto-set is_active to true
- Create team
- Check created_at timestamp exists
- Expect: Team has is_active: true
```

### Test Suite: GET /api/teams/:id (Get Single Team)

```
Test 2.1: Should fetch existing team
- Create team with id=1
- GET /api/teams/1
- Expect: 200, success: true, returns same team

Test 2.2: Should return 404 for non-existent team
- GET /api/teams/9999
- Expect: 404, success: false, "Team not found"

Test 2.3: Should reject invalid ID format
- GET /api/teams/not-a-number
- Expect: 400, success: false

Test 2.4: Should reject without JWT
- GET /api/teams/1 WITHOUT token
- Expect: 401

Test 2.5: Should include all team fields
- Create team
- Fetch it
- Expect: Has id, name, slug, company_id, created_at, updated_at, is_active
```

### Test Suite: PATCH /api/teams/:id (Update Team)

```
Test 3.1: Should update team name
- Create team with name "A"
- PATCH /api/teams/:id with { name: "B" }
- Expect: 200, name is "B"
- Verify in database: name is "B"

Test 3.2: Should update slug
- Create team
- PATCH with new slug
- Expect: 200, slug updated
- Verify in database

Test 3.3: Should partial update (only send one field)
- Create team
- PATCH with only { name: "New" } (no slug)
- Expect: Name updated, slug unchanged

Test 3.4: Should reject non-existent team
- PATCH /api/teams/9999
- Expect: 404, "Team not found"

Test 3.5: Should update updated_at timestamp
- Create team at time T1
- PATCH at time T2
- Expect: updated_at > created_at

Test 3.6: Should reject without JWT
- PATCH without token
- Expect: 401
```

### Test Suite: GET /api/teams/:id/members (Get Team Users)

```
Test 4.1: Should return empty array for team with no users
- Create team with no users
- GET /api/teams/:id/members
- Expect: 200, data: [], success: true

Test 4.2: Should return all active users in team
- Create team
- Create 3 users in team, 1 inactive
- GET /api/teams/:id/members
- Expect: 200, returns 3 users (only active)

Test 4.3: Should reject non-existent team
- GET /api/teams/9999/members
- Expect: 404 or empty array (depends on implementation)

Test 4.4: Should reject without JWT
- GET without token
- Expect: 401
```

---

## TEST FILE 2: USERS ENDPOINT TESTS (15 tests)

**File**: `src/routes/__tests__/users.test.ts`

### Test Suite: POST /api/users (Create User)

```
Test 1.1: Should create user with valid data
- Send: { team_id: 1, email: "alice@company.com", full_name: "Alice", role: "engineer" }
- Expect: 200, user object created

Test 1.2: Should reject missing team_id
- Send: { email: "alice@company.com" } (no team_id)
- Expect: 400, error about required field

Test 1.3: Should reject missing email
- Send: { team_id: 1 } (no email)
- Expect: 400, error about required field

Test 1.4: Should reject duplicate email
- Create user with email "alice@company.com"
- Try to create another with same email
- Expect: 400, error about duplicate email

Test 1.5: Should reject invalid email format
- Send: { team_id: 1, email: "not-an-email" }
- Expect: 400, error about invalid email

Test 1.6: Should reject without JWT
- POST without token
- Expect: 401

Test 1.7: Should auto-set is_active to true
- Create user
- Expect: is_active: true

Test 1.8: Should handle null full_name
- Create user without full_name
- Expect: 200, user created with full_name: null
```

### Test Suite: GET /api/users/:id (Get Single User)

```
Test 2.1: Should fetch existing user
- Create user
- GET /api/users/:id
- Expect: 200, returns same user

Test 2.2: Should return 404 for non-existent user
- GET /api/users/9999
- Expect: 404, "User not found"

Test 2.3: Should reject without JWT
- GET without token
- Expect: 401
```

### Test Suite: PATCH /api/users/:id (Update User)

```
Test 3.1: Should update user name
- Create user
- PATCH with { full_name: "Alice Smith" }
- Expect: 200, name updated

Test 3.2: Should update role
- Create user with role "engineer"
- PATCH with { role: "lead" }
- Expect: 200, role updated

Test 3.3: Should link Slack user ID
- Create user
- PATCH with { slack_user_id: "U12345" }
- Expect: 200, slack_user_id saved

Test 3.4: Should link GitHub username
- Create user
- PATCH with { github_username: "alice-dev" }
- Expect: 200, github_username saved

Test 3.5: Should reject non-existent user
- PATCH /api/users/9999
- Expect: 404
```

### Test Suite: DELETE /api/users/:id (Remove User - Soft Delete)

```
Test 4.1: Should soft delete user
- Create user with is_active: true
- DELETE /api/users/:id
- Expect: 200, { id: X, deleted: true }
- Verify in database: is_active: false

Test 4.2: Should reject non-existent user
- DELETE /api/users/9999
- Expect: 404

Test 4.3: Should reject without JWT
- DELETE without token
- Expect: 401
```

### Test Suite: GET /api/users/team/:teamId (Get Team Users)

```
Test 5.1: Should return all active users for team
- Create team with 3 active users, 1 inactive
- GET /api/users/team/:teamId
- Expect: 200, returns 3 users

Test 5.2: Should return empty array for team with no active users
- Create team with no users
- GET /api/users/team/:teamId
- Expect: 200, data: []
```

---

## TEST FILE 3: PROJECTS ENDPOINT TESTS (18 tests)

**File**: `src/routes/__tests__/projects.test.ts`

### Test Suite: POST /api/projects (Create Project)

```
Test 1.1: Should create project with valid data
- Send: { team_id: 1, name: "API Refactor", description: "...", owner_id: 1, deadline: "2024-04-01" }
- Expect: 200, project created with status "planning"

Test 1.2: Should reject missing team_id
- Send: { name: "API Refactor" } (no team_id)
- Expect: 400

Test 1.3: Should reject missing name
- Send: { team_id: 1 } (no name)
- Expect: 400

Test 1.4: Should auto-set status to "planning"
- Create project
- Expect: status: "planning"

Test 1.5: Should auto-set completion_percentage to 0
- Create project
- Expect: completion_percentage: 0

Test 1.6: Should handle optional fields
- Create project with only team_id and name (no owner, deadline, description)
- Expect: 200, project created with nulls for optional fields

Test 1.7: Should reject without JWT
- POST without token
- Expect: 401
```

### Test Suite: GET /api/projects/:id (Get Single Project)

```
Test 2.1: Should fetch existing project
- Create project
- GET /api/projects/:id
- Expect: 200, returns same project with owner details

Test 2.2: Should return 404 for non-existent project
- GET /api/projects/9999
- Expect: 404

Test 2.3: Should include owner relationship
- Create user as owner
- Create project with that owner
- GET /api/projects/:id
- Expect: Include full owner object with name, email, etc.
```

### Test Suite: PATCH /api/projects/:id (Update Project)

```
Test 3.1: Should update project status
- Create project with status "planning"
- PATCH with { status: "in_progress" }
- Expect: 200, status updated

Test 3.2: Should update completion percentage
- Create project
- PATCH with { completion_percentage: 50 }
- Expect: 200, completion updated

Test 3.3: Should update deadline
- Create project
- PATCH with new deadline
- Expect: 200, deadline updated

Test 3.4: Should partial update (only send one field)
- Create project
- PATCH with only { name: "New Name" }
- Expect: Only name updated, other fields unchanged

Test 3.5: Should reject non-existent project
- PATCH /api/projects/9999
- Expect: 404
```

### Test Suite: DELETE /api/projects/:id (Delete Project)

```
Test 4.1: Should delete project
- Create project
- DELETE /api/projects/:id
- Expect: 200, { id: X, deleted: true }
- Verify in database: project doesn't exist

Test 4.2: Should reject non-existent project
- DELETE /api/projects/9999
- Expect: 404
```

### Test Suite: GET /api/projects/team/:teamId (Get Team Projects)

```
Test 5.1: Should return all projects for team
- Create team with 3 projects
- GET /api/projects/team/:teamId
- Expect: 200, returns all 3 projects

Test 5.2: Should return empty array for team with no projects
- Create team with no projects
- GET /api/projects/team/:teamId
- Expect: 200, data: []
```

### Test Suite: POST /api/projects/:id/dependencies (Add Dependency)

```
Test 6.1: Should create dependency
- Create project A and project B
- POST /api/projects/A/dependencies with { depends_on_project_id: B }
- Expect: 200, dependency created

Test 6.2: Should reject missing depends_on_project_id
- POST with missing field
- Expect: 400

Test 6.3: Should allow circular dependencies (just store it)
- Create A depends on B, B depends on A
- Expect: Both allowed (frontend handles conflict detection)
```

### Test Suite: DELETE /api/projects/:id/dependencies/:depId (Remove Dependency)

```
Test 7.1: Should remove dependency
- Create dependency
- DELETE /api/projects/:id/dependencies/:depId
- Expect: 200, dependency removed
```

---

## TEST FILE 4: BLOCKERS ENDPOINT TESTS (12 tests)

**File**: `src/routes/__tests__/blockers.test.ts`

### Test Suite: POST /api/blockers (Create Blocker)

```
Test 1.1: Should create blocker with valid data
- Send: { team_id: 1, project_id: 1, title: "Design review pending", severity: "high" }
- Expect: 200, blocker created with status "open"

Test 1.2: Should reject missing team_id
- Send: { project_id: 1, title: "..." } (no team_id)
- Expect: 400

Test 1.3: Should reject missing project_id
- Send: { team_id: 1, title: "..." } (no project_id)
- Expect: 400

Test 1.4: Should reject missing title
- Send: { team_id: 1, project_id: 1 } (no title)
- Expect: 400

Test 1.5: Should auto-set status to "open"
- Create blocker
- Expect: status: "open"

Test 1.6: Should auto-set days_stalled to 0
- Create blocker
- Expect: days_stalled: 0

Test 1.7: Should reject without JWT
- POST without token
- Expect: 401
```

### Test Suite: GET /api/blockers/:id (Get Single Blocker)

```
Test 2.1: Should fetch existing blocker
- Create blocker
- GET /api/blockers/:id
- Expect: 200, returns same blocker with project & owner details

Test 2.2: Should return 404 for non-existent blocker
- GET /api/blockers/9999
- Expect: 404
```

### Test Suite: PATCH /api/blockers/:id (Update Blocker)

```
Test 3.1: Should update blocker status
- Create blocker with status "open"
- PATCH with { status: "in_progress" }
- Expect: 200, status updated

Test 3.2: Should update severity
- Create blocker
- PATCH with { severity: "critical" }
- Expect: 200, severity updated

Test 3.3: Should update days_stalled
- Create blocker
- PATCH with { days_stalled: 3 }
- Expect: 200, days_stalled updated

Test 3.4: Should reject non-existent blocker
- PATCH /api/blockers/9999
- Expect: 404
```

### Test Suite: DELETE /api/blockers/:id (Resolve Blocker)

```
Test 4.1: Should resolve blocker
- Create blocker with status "open"
- DELETE /api/blockers/:id
- Expect: 200, { id: X, resolved: true }
- Verify in database: status: "resolved"

Test 4.2: Should reject non-existent blocker
- DELETE /api/blockers/9999
- Expect: 404
```

### Test Suite: GET /api/blockers/team/:teamId (Get Team Blockers)

```
Test 5.1: Should return all blockers for team
- Create team with 3 blockers
- GET /api/blockers/team/:teamId
- Expect: 200, returns all 3 blockers

Test 5.2: Should return empty array if no blockers
- Create team with no blockers
- GET /api/blockers/team/:teamId
- Expect: 200, data: []
```

### Test Suite: GET /api/blockers/team/:teamId/active (Get Active Blockers)

```
Test 6.1: Should return only active blockers
- Create team with 3 blockers: 2 "open", 1 "resolved"
- GET /api/blockers/team/:teamId/active
- Expect: 200, returns only 2 "open" blockers (not "resolved")
```

---

## TEST FILE 5: WORK SIGNALS ENDPOINT TESTS (12 tests)

**File**: `src/routes/__tests__/workSignals.test.ts`

### Test Suite: POST /api/work-signals (Create Signal)

```
Test 1.1: Should create work signal with valid data
- Send: { team_id: 1, user_id: 1, source: "slack", signal_type: "message", metadata: { channel: "#eng" } }
- Expect: 200, signal created with timestamp

Test 1.2: Should reject missing team_id
- Send: { user_id: 1, source: "slack" } (no team_id)
- Expect: 400

Test 1.3: Should reject missing user_id
- Send: { team_id: 1, source: "slack" } (no user_id)
- Expect: 400

Test 1.4: Should reject missing source
- Send: { team_id: 1, user_id: 1 } (no source)
- Expect: 400

Test 1.5: Should handle metadata (flexible JSON)
- Create signal with complex metadata object
- Expect: 200, metadata stored exactly as provided

Test 1.6: Should auto-set timestamp to now
- Create signal
- Expect: timestamp is current time (within 1 second)

Test 1.7: Should reject without JWT
- POST without token
- Expect: 401
```

### Test Suite: GET /api/work-signals/user/:userId (Get User Signals)

```
Test 2.1: Should return all signals for user
- Create user with 3 signals
- GET /api/work-signals/user/:userId
- Expect: 200, returns all 3 signals, ordered by timestamp desc

Test 2.2: Should return empty array if no signals
- Create user with no signals
- GET /api/work-signals/user/:userId
- Expect: 200, data: []
```

### Test Suite: GET /api/work-signals/project/:projectId (Get Project Signals)

```
Test 3.1: Should return all signals for project
- Create project with 3 signals
- GET /api/work-signals/project/:projectId
- Expect: 200, returns all 3 signals

Test 3.2: Should return empty array if no signals
- Create project with no signals
- GET /api/work-signals/project/:projectId
- Expect: 200, data: []
```

### Test Suite: GET /api/work-signals/team/:teamId (Get Team Signals with Filters)

```
Test 4.1: Should return all signals for team
- Create team with 5 signals from different times
- GET /api/work-signals/team/:teamId
- Expect: 200, returns all 5 signals

Test 4.2: Should filter by from date
- Create signals at T1, T2, T3, T4
- GET /api/work-signals/team/:teamId?from=T2
- Expect: 200, returns only signals >= T2

Test 4.3: Should filter by to date
- Create signals at T1, T2, T3, T4
- GET /api/work-signals/team/:teamId?to=T3
- Expect: 200, returns only signals <= T3

Test 4.4: Should filter by date range
- Create signals at T1, T2, T3, T4
- GET /api/work-signals/team/:teamId?from=T2&to=T3
- Expect: 200, returns signals between T2 and T3

Test 4.5: Should return empty if no signals match
- GET /api/work-signals/team/:teamId?from=future_date
- Expect: 200, data: []
```

---

## TEST FILE 6: HEALTH SCORE ENDPOINT TESTS (8 tests)

**File**: `src/routes/__tests__/healthScore.test.ts`

### Test Suite: GET /api/health-score/:teamId (Get Current Score)

```
Test 1.1: Should return current health score snapshot
- Create team
- Create health_score_snapshot for team
- GET /api/health-score/:teamId
- Expect: 200, returns most recent snapshot with all fields

Test 1.2: Should return 404 if no snapshot exists
- Create team with no snapshots
- GET /api/health-score/:teamId
- Expect: 404, "No health score snapshot found"

Test 1.3: Should include all score fields
- Get health score
- Expect: Has productivity_score, collaboration_score, velocity_score, overall_score

Test 1.4: Should return most recent snapshot only
- Create 3 snapshots for team on different dates
- GET /api/health-score/:teamId
- Expect: Returns the most recent one only
```

### Test Suite: GET /api/health-score/:teamId/history (Get Score History)

```
Test 2.1: Should return score history for 30 days (default)
- Create team with 5 snapshots over 30 days
- GET /api/health-score/:teamId/history
- Expect: 200, returns all 5 snapshots ordered by date asc

Test 2.2: Should filter by custom days parameter
- Create team with 10 snapshots over 60 days
- GET /api/health-score/:teamId/history?days=7
- Expect: Returns only snapshots from last 7 days

Test 2.3: Should return empty array if no snapshots
- Create team with no snapshots
- GET /api/health-score/:teamId/history
- Expect: 200, data: []
```

### Test Suite: POST /api/health-score/:teamId/calculate (Recalculate Score)

```
Test 3.1: Should calculate and store new health score
- Create team with users and work signals
- POST /api/health-score/:teamId/calculate
- Expect: 200, returns new snapshot with calculated scores

Test 3.2: Should use correct formula
- Create team with known work signals
- Calculate: (productivity * 0.4) + (collaboration * 0.3) + (velocity * 0.3)
- POST /api/health-score/:teamId/calculate
- Expect: overall_score matches formula result

Test 3.3: Should create new snapshot in database
- POST /api/health-score/:teamId/calculate
- Expect: New row in health_score_snapshots table with today's date
```

---

## TEST FILE 7: INTEGRATIONS & ADMIN TESTS (8 tests)

**File**: `src/routes/__tests__/integrations.test.ts`

### Test Suite: Slack Integration

```
Test 1.1: Should return Slack OAuth URL
- GET /api/integrations/slack/connect
- Expect: 200, returns URL with client_id and scopes

Test 1.2: Should handle Slack OAuth callback
- POST /api/integrations/slack/callback with { code: "...", teamId: 1 }
- Expect: 200, { success: true, message: "Slack integrated successfully" }

Test 1.3: Should reject without JWT
- POST without token
- Expect: 401
```

### Test Suite: GitHub Integration

```
Test 2.1: Should connect GitHub account with PAT
- POST /api/integrations/github/connect with { pat: "ghp_...", userId: 1 }
- Expect: 200, returns user with github_username set

Test 2.2: Should reject invalid PAT
- POST with { pat: "invalid_token", userId: 1 }
- Expect: 400 or 500, error about invalid token
```

### Test Suite: Integration Status & Manual Sync

```
Test 3.1: Should return integration status
- GET /api/integrations/status/:teamId
- Expect: 200, { slack: "connected", github: "connected" } (or similar)

Test 3.2: Should trigger manual sync
- POST /api/integrations/sync/manual/:teamId
- Expect: 200, { message: "Sync jobs triggered" }

Test 3.3: Should reject without JWT
- POST/GET without token
- Expect: 401
```

### Test Suite: Admin Endpoints

```
Test 4.1: Should trigger all sync jobs
- POST /api/admin/sync-all-teams
- Expect: 200, { message: "All sync jobs triggered" }

Test 4.2: Should get job logs
- GET /api/admin/logs
- Expect: 200, returns logs array

Test 4.3: Should reject without JWT on admin endpoints
- POST/GET admin endpoints without token
- Expect: 401
```

---

## TEST FILE 8: GLOBAL & ERROR HANDLING TESTS (5 tests)

**File**: `src/routes/__tests__/global.test.ts`

### Test Suite: Health Check & Error Handling

```
Test 1.1: Should return health check (no JWT needed)
- GET /api/health
- Expect: 200, { success: true, status: "healthy" }

Test 1.2: Should handle generic 500 errors
- Mock prisma to throw unexpected error
- Call any endpoint
- Expect: 500, { success: false, error: "generic message" } (not exposing real error)

Test 1.3: Should handle validation errors
- Send invalid JSON to POST endpoint
- Expect: 400, success: false

Test 1.4: Should return consistent response format
- Call 10 different endpoints (success and error cases)
- Expect: ALL responses have { success, data, error } structure

Test 1.5: Should include timestamps in responses
- Create any resource
- Expect: created_at, updated_at fields present
```

---

## TEST EXECUTION INSTRUCTIONS FOR ANTI-GRAVITY

### Step 1: Generate All Test Files

Create these files with full test implementations:
1. `src/routes/__tests__/teams.test.ts` - 20 tests
2. `src/routes/__tests__/users.test.ts` - 15 tests
3. `src/routes/__tests__/projects.test.ts` - 18 tests
4. `src/routes/__tests__/blockers.test.ts` - 12 tests
5. `src/routes/__tests__/workSignals.test.ts` - 12 tests
6. `src/routes/__tests__/healthScore.test.ts` - 8 tests
7. `src/routes/__tests__/integrations.test.ts` - 8 tests
8. `src/routes/__tests__/global.test.ts` - 5 tests

**Total: 98 test cases (more than 60 required)**

### Step 2: Create Test Setup File

Create `src/tests/setup.ts`:
```typescript
import { prisma } from '@/utils/db';

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

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Step 3: Update jest.config.json

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src"],
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "moduleFileExtensions": ["ts", "js"],
  "moduleNameMapper": {
    "@/(.*)": "<rootDir>/src/$1"
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts"
  ]
}
```

### Step 4: Generate Complete package.json Scripts

```json
{
  "scripts": {
    "test": "jest --forceExit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:single": "jest --testNamePattern"
  }
}
```

### Step 5: Run Tests & Generate Report

After generating all test files:

```bash
npm install
npx prisma generate
npm test 2>&1 | tee TEST_RESULTS.md
```

### Step 6: Generate TEST_RESULTS.md

The test execution will output something like:

```markdown
# TEST EXECUTION RESULTS

## Summary
- ✅ Test Suites: 8 passed, 8 total
- ✅ Tests: 98 passed, 0 failed
- ✅ Coverage: 92% statements, 88% branches, 90% functions
- ✅ Duration: 45.2 seconds

## Test Breakdown

### teams.test.ts
✅ POST /api/teams (7 tests passed)
✅ GET /api/teams/:id (5 tests passed)
✅ PATCH /api/teams/:id (6 tests passed)
✅ GET /api/teams/:id/members (2 tests passed)
Total: 20 passed

### users.test.ts
✅ POST /api/users (8 tests passed)
✅ GET /api/users/:id (3 tests passed)
✅ PATCH /api/users/:id (2 tests passed)
✅ DELETE /api/users/:id (1 test passed)
✅ GET /api/users/team/:teamId (1 test passed)
Total: 15 passed

[... continue for all 8 files ...]

## All Tests Status: ✅ PASSED

No failures, no warnings.
```

---

## IMPORTANT NOTES FOR ANTI-GRAVITY

1. **Mock JWT**: Use "Bearer mock_jwt_token" for all authenticated tests
2. **Test Database**: Use same PostgreSQL as development (or SQLite for tests if configured)
3. **Mocking**: Mock external APIs (Slack, GitHub) - don't make real API calls
4. **Setup/Teardown**: Clear database before each test to ensure isolation
5. **Error Cases**: Test both happy path AND error paths
6. **Database Cleanup**: Delete all data after each test, before next one runs
7. **Async/Await**: Use proper async/await, not callbacks
8. **Assertions**: Use expect() for all validations
9. **Response Validation**: Always check status code, success flag, and data structure
10. **No Hardcoded Values**: Use variables, not magic numbers

---

## EXPECTED OUTPUT

After running `npm test`, you should see:

```
PASS  src/routes/__tests__/teams.test.ts
PASS  src/routes/__tests__/users.test.ts
PASS  src/routes/__tests__/projects.test.ts
PASS  src/routes/__tests__/blockers.test.ts
PASS  src/routes/__tests__/workSignals.test.ts
PASS  src/routes/__tests__/healthScore.test.ts
PASS  src/routes/__tests__/integrations.test.ts
PASS  src/routes/__tests__/global.test.ts

Test Suites: 8 passed, 8 total
Tests:       98 passed, 98 total
Coverage:    90%+
Time:        45-60 seconds
```

---

## HOW TO USE THIS DOCUMENT

1. **Copy this ENTIRE document**
2. **Paste into Anti-Gravity**
3. **Say**: "Generate all Jest test files based on this specification"
4. **Wait**: Anti-Gravity generates test files
5. **Run**: `npm install && npm test`
6. **Collect**: Copy the output to TEST_RESULTS.md
7. **Share**: Give me the TEST_RESULTS.md file

---

## AFTER ANTI-GRAVITY FINISHES

You will have:
✅ 8 test files with 98 tests  
✅ All tests passing (or we fix any failures)  
✅ TEST_RESULTS.md showing success  
✅ 90%+ code coverage  
✅ Production-ready backend  

Then you message me:
> "Testing is complete! Here's TEST_RESULTS.md. All 98 tests passed. What are the next steps?"

And I'll tell you exactly what to do next! 🚀

---

**That's it. Simple. Anti-Gravity does all the work. You just share the results with me.**
