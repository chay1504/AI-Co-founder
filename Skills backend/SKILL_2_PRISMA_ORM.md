# Backend Skill 2: Prisma ORM - Querying the Database

## What is Prisma?

Prisma is a tool that lets you talk to your database using **simple JavaScript** instead of writing SQL.

**Before Prisma (scary SQL):**
```sql
SELECT * FROM users WHERE team_id = 5 AND is_active = true;
```

**With Prisma (friendly JavaScript):**
```typescript
const users = await prisma.users.findMany({
  where: {
    team_id: 5,
    is_active: true
  }
});
```

Much nicer, right? Prisma also **prevents SQL injection attacks** and gives you **type safety**.

---

## Prisma Schema (Schema.prisma)

First, define your database tables:

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Table: teams
model teams {
  id              BigInt    @id @default(autoincrement())
  name            String    @db.VarChar(255)
  slug            String    @unique @db.VarChar(255)
  company_id      String
  created_at      DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  users           users[]
  projects        projects[]
  work_signals    work_signals[]
  
  @@map("teams")
}

// Table: users
model users {
  id              BigInt    @id @default(autoincrement())
  team_id         BigInt    @db.BigInt
  email           String    @unique @db.VarChar(255)
  full_name       String?   @db.VarChar(255)
  role            String?   @db.VarChar(50)
  slack_user_id   String?   @db.VarChar(255)
  github_username String?   @db.VarChar(255)
  is_active       Boolean   @default(true)
  created_at      DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  team            teams     @relation(fields: [team_id], references: [id])
  projects        projects[]
  work_signals    work_signals[]
  blockers        blockers[]
  
  @@map("users")
}

// Table: projects
model projects {
  id                    BigInt    @id @default(autoincrement())
  team_id               BigInt    @db.BigInt
  name                  String    @db.VarChar(255)
  description           String?   @db.Text
  status                String?   @db.VarChar(50)
  owner_id              BigInt?   @db.BigInt
  start_date            DateTime? @db.Date
  deadline              DateTime? @db.Date
  completion_percentage Int       @default(0)
  created_at            DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  team                  teams         @relation(fields: [team_id], references: [id])
  owner                 users?        @relation(fields: [owner_id], references: [id])
  dependencies_from     project_dependencies[] @relation("from")
  dependencies_to       project_dependencies[] @relation("to")
  work_signals          work_signals[]
  blockers              blockers[]
  
  @@map("projects")
}

// Table: project_dependencies
model project_dependencies {
  id                    BigInt    @id @default(autoincrement())
  project_id            BigInt    @db.BigInt
  depends_on_project_id BigInt    @db.BigInt
  created_at            DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  project               projects  @relation("from", fields: [project_id], references: [id])
  depends_on            projects  @relation("to", fields: [depends_on_project_id], references: [id])
  
  @@map("project_dependencies")
}

// Table: work_signals
model work_signals {
  id          BigInt    @id @default(autoincrement())
  team_id     BigInt    @db.BigInt
  user_id     BigInt    @db.BigInt
  source      String    @db.VarChar(50)  // 'slack', 'github', etc
  signal_type String    @db.VarChar(100) // 'message', 'commit', etc
  project_id  BigInt?   @db.BigInt
  metadata    Json?                       // Flexible data storage
  timestamp   DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  team        teams     @relation(fields: [team_id], references: [id])
  user        users     @relation(fields: [user_id], references: [id])
  project     projects? @relation(fields: [project_id], references: [id])
  
  @@map("work_signals")
}

// Table: health_score_snapshots
model health_score_snapshots {
  id                   BigInt    @id @default(autoincrement())
  team_id              BigInt    @db.BigInt
  productivity_score   Decimal   @db.Decimal(5, 2)
  collaboration_score  Decimal   @db.Decimal(5, 2)
  velocity_score       Decimal   @db.Decimal(5, 2)
  overall_score        Decimal   @db.Decimal(5, 2)
  snapshot_date        DateTime  @db.Date
  created_at           DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  team                 teams     @relation(fields: [team_id], references: [id])
  
  @@map("health_score_snapshots")
}

// Table: blockers
model blockers {
  id          BigInt    @id @default(autoincrement())
  team_id     BigInt    @db.BigInt
  project_id  BigInt    @db.BigInt
  title       String    @db.VarChar(255)
  description String?   @db.Text
  owner_id    BigInt?   @db.BigInt
  severity    String?   @db.VarChar(50)  // 'low', 'medium', 'high'
  days_stalled Int      @default(0)
  created_at  DateTime  @default(now()) @db.Timestamp(6)
  
  // Relationships
  team        teams     @relation(fields: [team_id], references: [id])
  project     projects  @relation(fields: [project_id], references: [id])
  owner       users?    @relation(fields: [owner_id], references: [id])
  
  @@map("blockers")
}
```

---

## Setting Up Prisma

```bash
# Install Prisma
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init

# Create a migration (creates the tables in database)
npx prisma migrate dev --name init

# Generate Prisma client (do this after schema changes)
npx prisma generate
```

---

## Basic CRUD Operations

### CREATE (Insert a new row)

```typescript
// Add a new team
const newTeam = await prisma.teams.create({
  data: {
    name: 'Engineering',
    slug: 'eng',
    company_id: 'company_123',
    created_at: new Date()
  }
});
// Returns: { id: 1, name: 'Engineering', ... }

// Add a new user
const newUser = await prisma.users.create({
  data: {
    team_id: 1,
    email: 'alice@company.com',
    full_name: 'Alice Johnson',
    role: 'engineer',
    is_active: true
  }
});
```

### READ (Fetch data)

```typescript
// Get ONE record by ID
const team = await prisma.teams.findUnique({
  where: { id: 1 }
});
// Returns: { id: 1, name: 'Engineering', ... } or null

// Get ONE record by email (unique field)
const user = await prisma.users.findUnique({
  where: { email: 'alice@company.com' }
});

// Get MANY records
const allTeams = await prisma.teams.findMany();
// Returns: [{ id: 1, name: 'Engineering' }, { id: 2, ... }]

// Get MANY with filters (WHERE clause)
const activeEngineers = await prisma.users.findMany({
  where: {
    role: 'engineer',
    is_active: true
  }
});

// Get with specific fields only
const teamNames = await prisma.teams.findMany({
  select: {
    id: true,
    name: true
    // email NOT included
  }
});

// Get with relationships (JOIN)
const teamWithUsers = await prisma.teams.findUnique({
  where: { id: 1 },
  include: {
    users: true  // Also fetch all users in this team
  }
});
// Returns: { id: 1, name: 'Engineering', users: [{ id: 1, email: ... }, ...] }

// Filter AND sort
const projects = await prisma.projects.findMany({
  where: {
    team_id: 1,
    status: 'in_progress'
  },
  orderBy: {
    deadline: 'asc'  // Sort by deadline ascending
  },
  take: 10  // Limit to 10 results
});

// Get COUNT
const userCount = await prisma.users.count({
  where: { team_id: 1 }
});
// Returns: 5
```

### UPDATE (Modify existing row)

```typescript
// Update one record
const updatedTeam = await prisma.teams.update({
  where: { id: 1 },
  data: {
    name: 'Backend Team'
    // Only fields you want to change
  }
});

// Update MANY records at once
const result = await prisma.users.updateMany({
  where: { team_id: 1 },
  data: { is_active: false }
  // Deactivates all users in team 1
});
// Returns: { count: 5 } (5 records updated)

// Update with conditions
const result = await prisma.projects.update({
  where: { id: 5 },
  data: {
    completion_percentage: 100,
    status: 'completed'
  }
});
```

### DELETE (Remove a row)

```typescript
// Delete one record
const deleted = await prisma.teams.delete({
  where: { id: 1 }
});
// Returns the deleted record

// Delete MANY records
const result = await prisma.blockers.deleteMany({
  where: { severity: 'low' }
});
// Returns: { count: 3 } (3 records deleted)

// Delete with conditions
const result = await prisma.work_signals.deleteMany({
  where: {
    team_id: 1,
    timestamp: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)  // Older than 30 days
    }
  }
});
```

---

## Advanced Queries

### Aggregate Data (COUNT, SUM, AVG)

```typescript
// Count total users in a team
const count = await prisma.users.count({
  where: { team_id: 1 }
});
// Returns: 5

// Group and count (how many projects per status)
const statusCount = await prisma.projects.groupBy({
  by: ['status'],
  where: { team_id: 1 },
  _count: {
    id: true
  }
});
// Returns: [
//   { status: 'in_progress', _count: { id: 3 } },
//   { status: 'blocked', _count: { id: 1 } }
// ]

// Get average completion percentage
const avgCompletion = await prisma.projects.aggregate({
  where: { team_id: 1 },
  _avg: {
    completion_percentage: true
  }
});
// Returns: { _avg: { completion_percentage: 65.5 } }
```

### Relationships (Get Related Data)

```typescript
// Get team WITH all its users
const teamWithUsers = await prisma.teams.findUnique({
  where: { id: 1 },
  include: {
    users: true,
    projects: true
  }
});
// Returns: { id: 1, name: '...', users: [...], projects: [...] }

// Get project WITH its owner AND team
const project = await prisma.projects.findUnique({
  where: { id: 5 },
  include: {
    owner: true,
    team: true
  }
});
// Returns: { id: 5, name: '...', owner: { id: 1, ... }, team: { id: 1, ... } }

// Filter by related data
const projectsByLead = await prisma.projects.findMany({
  where: {
    owner: {
      full_name: {
        contains: 'Alice'
      }
    }
  }
});
// Returns all projects owned by someone named Alice
```

### Work with JSON Data

```typescript
// Store metadata in work_signals
const signal = await prisma.work_signals.create({
  data: {
    team_id: 1,
    user_id: 1,
    source: 'github',
    signal_type: 'commit',
    metadata: {
      repo: 'ai-cofounder',
      commit_hash: 'abc123',
      message: 'Fix health score calculation',
      files_changed: 3,
      lines_added: 25
    }
  }
});

// Query by JSON field
const commits = await prisma.work_signals.findMany({
  where: {
    source: 'github',
    metadata: {
      path: ['signal_type'],
      equals: 'commit'
    }
  }
});
```

---

## Transactions (Multiple Operations As One)

Sometimes you need multiple changes to happen together. Use transactions:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Step 1: Create project
  const project = await tx.projects.create({
    data: {
      team_id: 1,
      name: 'New Feature'
    }
  });
  
  // Step 2: Create work signal
  const signal = await tx.work_signals.create({
    data: {
      team_id: 1,
      project_id: project.id,
      user_id: 1,
      source: 'manual',
      signal_type: 'project_created'
    }
  });
  
  // Both happen together, or both fail together
  return { project, signal };
});
```

**Why use this?** If step 1 succeeds but step 2 fails, you'd have a project without a signal. Transactions prevent this.

---

## Error Handling

```typescript
try {
  const user = await prisma.users.create({
    data: {
      team_id: 1,
      email: 'alice@company.com'
    }
  });
} catch (error) {
  // Prisma error handling
  if (error.code === 'P2002') {
    // Unique constraint failed (email already exists)
    console.log('Email already in use');
  } else if (error.code === 'P2025') {
    // Record not found
    console.log('Team not found');
  } else {
    console.log('Unknown error:', error);
  }
}
```

---

## Migrations (When You Change Schema)

```bash
# After modifying schema.prisma, run:
npx prisma migrate dev --name add_description_to_projects

# This:
# 1. Creates a migration file
# 2. Updates your database
# 3. Regenerates Prisma types

# To see migration status:
npx prisma migrate status

# To view schema visually:
npx prisma studio  # Opens web UI to browse your database
```

---

## Setup: Connect Prisma to Your Backend

```typescript
// src/utils/db.ts

import { PrismaClient } from '@prisma/client';

// Create one instance for your whole app
export const prisma = new PrismaClient();

// Optionally log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + JSON.stringify(e.params));
    console.log('Duration: ' + e.duration + 'ms');
  });
}
```

Then in your endpoints:

```typescript
import { prisma } from '@/utils/db';

router.get('/teams/:id', async (req, res) => {
  const team = await prisma.teams.findUnique({
    where: { id: parseInt(req.params.id) }
  });
  
  res.json({ success: true, data: team, error: null });
});
```

---

## Common Patterns

### Pagination

```typescript
const page = parseInt(req.query.page) || 1;
const pageSize = 10;

const users = await prisma.users.findMany({
  where: { team_id: 1 },
  skip: (page - 1) * pageSize,  // Skip N records
  take: pageSize                 // Get N records
  // Page 1: skip 0, take 10
  // Page 2: skip 10, take 10
  // Page 3: skip 20, take 10
});
```

### Search

```typescript
const searchTerm = req.query.q;

const projects = await prisma.projects.findMany({
  where: {
    team_id: 1,
    name: {
      contains: searchTerm,
      mode: 'insensitive'  // Case-insensitive
    }
  }
});
```

### Date Range

```typescript
const from = new Date(req.query.from);
const to = new Date(req.query.to);

const signals = await prisma.work_signals.findMany({
  where: {
    team_id: 1,
    timestamp: {
      gte: from,  // Greater than or equal
      lte: to     // Less than or equal
    }
  }
});
```

---

## Checklist for Using Prisma

- ✅ Define schema in `schema.prisma`
- ✅ Run `npx prisma migrate dev` to create tables
- ✅ Import `prisma` client in your endpoints
- ✅ Use `try/catch` for error handling
- ✅ Always validate input before querying
- ✅ Use `include` for relationships
- ✅ Use pagination for large datasets
- ✅ Log queries in development

You now know how to query databases like a pro! 🎉

