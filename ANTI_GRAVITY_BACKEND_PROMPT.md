# AI Co-Founder MVP - Complete Backend Build Prompt for Anti-Gravity

## OBJECTIVE
Build a **production-ready backend** for the AI Co-Founder MVP that handles:
- 4 core features (Digital Twin, Productivity Tracking, Health Score, Bottleneck Detection)
- Real-time API integrations (Slack, GitHub)
- Scheduled jobs for daily syncing
- Database with 7 core tables
- All endpoints documented and tested

---

## CONSTRAINT
- **We have ZERO backend knowledge** — Code must be clean, well-commented, and production-ready
- **No shortcuts** — Every function must be tested
- **Output**: Deployable to Render immediately
- **Timeline**: 4 weeks to completion

---

## SPECIFICATIONS (From Roadmap)

### Tech Stack (NON-NEGOTIABLE)
```
Runtime:      Node.js 18+
Language:     TypeScript
Framework:    Express.js (standalone backend)
Database:     PostgreSQL
ORM:          Prisma
Scheduler:    Agenda.js
Auth:         Clerk (verify JWT tokens)
APIs:         Slack, GitHub (v1), Google Workspace (v2)
Deployment:   Render
```

### Database Schema (From Roadmap)
**7 Core Tables:**
1. `teams` — Company/workspace
2. `users` — Team members with role, email, integrations (slack_user_id, github_username)
3. `projects` — Projects with owner, status, deadline, completion %
4. `project_dependencies` — What blocks what
5. `work_signals` — Raw activity (commits, messages, edits) with metadata
6. `health_score_snapshots` — Daily health score history
7. `blockers` — Stalled items with age, severity, owner

### API Endpoints (ALL REQUIRED)

#### Teams
```
POST   /api/teams              (Create team)
GET    /api/teams/:id          (Get team details)
PATCH  /api/teams/:id          (Update team)
GET    /api/teams/:id/members  (Get all users in team)
```

#### Users
```
POST   /api/users              (Add user to team)
GET    /api/users/:id          (Get user details)
PATCH  /api/users/:id          (Update user)
DELETE /api/users/:id          (Remove user)
GET    /api/users/team/:teamId (Get all users in team)
```

#### Projects
```
POST   /api/projects           (Create project)
GET    /api/projects/:id       (Get project)
PATCH  /api/projects/:id       (Update status, deadline, completion)
DELETE /api/projects/:id       (Delete project)
GET    /api/projects/team/:teamId (List team projects)
POST   /api/projects/:id/dependencies (Add dependency)
DELETE /api/projects/:id/dependencies/:depId (Remove dependency)
```

#### Work Signals
```
POST   /api/work-signals       (Store raw signal from API)
GET    /api/work-signals/user/:userId (Get signals for one user)
GET    /api/work-signals/project/:projectId (Get signals for project)
GET    /api/work-signals/team/:teamId?from=YYYY-MM-DD&to=YYYY-MM-DD (Filter by date)
```

#### Health Score
```
GET    /api/health-score/:teamId (Get current health score)
GET    /api/health-score/:teamId/history?days=30 (Get 30-day trend)
POST   /api/health-score/:teamId/calculate (Force recalculate)
```

#### Blockers
```
POST   /api/blockers           (Create blocker)
GET    /api/blockers/:id       (Get blocker)
PATCH  /api/blockers/:id       (Update blocker)
DELETE /api/blockers/:id       (Resolve/delete blocker)
GET    /api/blockers/team/:teamId (List team blockers)
GET    /api/blockers/team/:teamId/active (Get active blockers only)
```

#### Integrations
```
POST   /api/integrations/slack/connect (OAuth flow start)
POST   /api/integrations/slack/callback (OAuth callback)
POST   /api/integrations/github/connect (GitHub PAT input)
GET    /api/integrations/status/:teamId (Check integration status)
POST   /api/integrations/sync/manual/:teamId (Force sync)
```

#### Admin/Utility
```
GET    /api/health (Server health check)
POST   /api/admin/sync-all-teams (Run all scheduled jobs immediately)
GET    /api/admin/logs (View last 100 job logs)
```

---

## IMPLEMENTATION REQUIREMENTS

### 1. Project Structure
```
backend/
├── src/
│   ├── index.ts                    (Entry point, server setup)
│   ├── middleware/
│   │   ├── auth.ts                 (Clerk JWT validation)
│   │   ├── errorHandler.ts         (Global error handling)
│   │   └── logger.ts               (Request logging)
│   ├── routes/
│   │   ├── teams.ts
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── workSignals.ts
│   │   ├── healthScore.ts
│   │   ├── blockers.ts
│   │   └── integrations.ts
│   ├── services/
│   │   ├── team.service.ts
│   │   ├── user.service.ts
│   │   ├── project.service.ts
│   │   ├── workSignal.service.ts
│   │   ├── healthScore.service.ts
│   │   ├── blocker.service.ts
│   │   ├── slack.service.ts
│   │   └── github.service.ts
│   ├── jobs/
│   │   ├── slackSync.job.ts        (Hourly: fetch Slack messages)
│   │   ├── githubSync.job.ts       (Hourly: fetch GitHub commits/PRs)
│   │   ├── healthScoreCalc.job.ts  (Daily: calculate health score)
│   │   └── scheduler.ts            (Agenda setup)
│   ├── utils/
│   │   ├── db.ts                   (Prisma client setup)
│   │   ├── clerk.ts                (Clerk verification)
│   │   └── metrics.ts              (Health score calculation logic)
│   ├── types/
│   │   └── index.ts                (TypeScript interfaces)
│   └── prisma/
│       └── schema.prisma           (Database schema)
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile (for Render)
```

### 2. Database Schema (Prisma)
Must include all 7 tables with proper:
- Foreign key relationships
- Indexes for performance
- Timestamps (createdAt, updatedAt)
- Proper data types (VARCHAR, BIGINT, DECIMAL, JSONB)

### 3. API Standards
- All responses use standard JSON format:
  ```json
  {
    "success": true,
    "data": { /* endpoint-specific */ },
    "error": null
  }
  ```
- All errors include status code + error message
- All endpoints require Clerk JWT in Authorization header
- Rate limiting: 1000 requests/hour per IP
- CORS configured for Vercel frontend

### 4. Slack Integration
- OAuth flow (3-legged) for secure token storage
- Scheduled job: Fetch messages every hour
- Store message metadata (user, timestamp, channel, text) in `work_signals`
- Handle rate limiting (Slack: 60 requests/minute)
- Support for multiple channels

### 5. GitHub Integration
- PAT-based authentication (user provides Personal Access Token)
- Scheduled job: Fetch commits, PRs, reviews every hour
- Store in `work_signals` with metadata (repo, commit hash, author, lines changed)
- Handle rate limiting (GitHub: 5000 requests/hour)

### 6. Health Score Calculation
Formula (MUST MATCH):
```
Health Score = (Productivity × 0.4) + (Collaboration × 0.3) + (Velocity × 0.3)

Productivity = % of team with activity in last 7 days (0-100)
Collaboration = (cross-project messages / total messages) × 100 (0-100)
Velocity = (completed tasks / planned tasks) × 100, capped at 100 (0-100)
```
- Run daily at 2 AM UTC
- Store snapshots in `health_score_snapshots`
- Calculate from `work_signals` data

### 7. Error Handling
- Try/catch on all async functions
- Log all errors with context
- Return 5xx only for server errors
- Return 4xx for client errors (validation, not found, etc.)
- No sensitive data in error messages

### 8. Authentication
- Every endpoint requires valid Clerk JWT
- Extract user from token
- Verify user belongs to requested team
- Return 401 if invalid token, 403 if unauthorized

### 9. Logging
- Log all API requests (method, path, response time)
- Log all job executions (start, end, success/fail)
- Log all integration syncs (what was fetched, how many records)
- Keep last 100 logs in memory (or database table)

### 10. Testing Requirements
For each endpoint:
- ✅ Test with valid input → expect 200
- ✅ Test with invalid input → expect 400
- ✅ Test without JWT → expect 401
- ✅ Test with wrong team → expect 403
- ✅ Test with non-existent resource → expect 404

For each scheduled job:
- ✅ Test triggers correctly at scheduled time
- ✅ Test handles API errors gracefully
- ✅ Test stores correct data in database
- ✅ Test rate limiting doesn't break sync

---

## DELIVERABLES (PER WEEK)

### Week 1: Foundation
```
✅ Express server running on Render
✅ Prisma connected to PostgreSQL
✅ Database schema created (all 7 tables)
✅ Clerk JWT middleware working
✅ Team CRUD endpoints functional
✅ /api/health endpoint returns 200
✅ Deploy to Render (skeleton ready)
```

### Week 2: Core APIs
```
✅ Users CRUD endpoints
✅ Projects CRUD endpoints
✅ Project dependencies working
✅ Blockers CRUD endpoints
✅ All endpoints tested locally
✅ Error handling on all endpoints
✅ Deploy to Render (all CRUD working)
```

### Week 3: Integrations + Scheduling
```
✅ Slack OAuth flow complete
✅ Slack sync job fetching messages
✅ Work signals storing correctly
✅ Agenda.js scheduler running
✅ GitHub PAT integration (basic)
✅ GitHub sync job (optional, can add later)
✅ Deploy to Render (integrations live)
```

### Week 4: Health Score + Polish
```
✅ Health score calculation logic
✅ Health score endpoint working
✅ Daily snapshot job running
✅ All endpoints thoroughly tested
✅ Error handling comprehensive
✅ Performance optimized (sub-500ms responses)
✅ Documentation complete
✅ Final deploy to Render (MVP complete)
```

---

## CRITICAL NOTES

1. **No Shortcuts** — Every function must have:
   - Input validation
   - Error handling
   - Logging
   - Comments explaining logic

2. **Security** — NEVER:
   - Log API keys or tokens
   - Store plaintext secrets
   - Skip JWT verification
   - Allow SQL injection

3. **Performance** — MUST:
   - Index database queries
   - Cache health score (recalc once/day)
   - Handle rate limiting gracefully
   - Return in < 500ms

4. **Testing** — EVERY endpoint must:
   - Pass unit tests
   - Pass integration tests
   - Handle edge cases
   - Return correct error codes

5. **Deployment** — Must work on Render:
   - Include Dockerfile (if needed)
   - Use environment variables
   - Connect to Render Postgres
   - Auto-scale jobs

---

## SUCCESS CRITERIA

- ✅ Backend deployed to Render and accessible
- ✅ All 35 endpoints working and tested
- ✅ Slack integration syncing messages hourly
- ✅ Health score calculating daily
- ✅ Database queries under 200ms
- ✅ No console errors or warnings
- ✅ All error cases handled gracefully
- ✅ Ready for frontend to consume APIs

---

## QUESTIONS FOR CLARIFICATION

Before starting, confirm:

1. **Slack Workspace**: Which Slack workspace should test integration against?
2. **GitHub Repos**: Which GitHub repos to monitor for signals?
3. **Render Postgres**: Should use free tier or paid? (Free is sufficient for MVP)
4. **Deployment**: Deploy to staging or production directly?
5. **Email Alerts**: Should blockers send email alerts or just store in DB?

---

## ANTI-GRAVITY INSTRUCTIONS

When you receive this:

1. **Extract** all requirements from this document
2. **Validate** against the roadmap PDF
3. **Generate** complete, production-ready backend code
4. **Include** comprehensive comments explaining every function
5. **Output** all files in a single GitHub-ready structure
6. **Test** every endpoint before returning
7. **Document** with README for deployment

Do NOT proceed with frontend—backend must be 100% complete and tested first.

---

## Timeline: Start Monday, Complete Friday of Week 4

Go! 🚀

