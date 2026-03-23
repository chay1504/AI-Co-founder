# Backend Skill 1: Express.js API Structure & Best Practices

## What is Express.js?

Express is a lightweight web framework that helps you:
- Create API endpoints (GET, POST, PATCH, DELETE)
- Handle incoming requests
- Send back responses
- Manage middleware (processing steps before response)

Think of it like: **A waiter that takes requests from customers (frontend) and delivers responses from the kitchen (database)**.

---

## Basic API Endpoint Structure

### Simple GET Endpoint (No Database)

```typescript
// Get a list of teams
app.get('/api/teams', (req, res) => {
  // This runs when someone calls GET /api/teams
  
  const teams = [
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Design' }
  ];
  
  res.json({ success: true, data: teams });
});
```

**What happens:**
1. User visits `https://yoursite.com/api/teams`
2. Express catches this request
3. Runs the function above
4. Sends back JSON response

---

## Standard Response Format (ALWAYS USE THIS)

Every endpoint must return this structure:

```json
{
  "success": true,
  "data": { /* actual data */ },
  "error": null
}
```

**Success example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Engineering Team",
    "members": 5
  },
  "error": null
}
```

**Error example:**
```json
{
  "success": false,
  "data": null,
  "error": "Team not found"
}
```

---

## All HTTP Methods (What We Use)

| Method | Purpose | Example |
|--------|---------|---------|
| **GET** | Fetch data | `GET /api/teams/1` → returns team |
| **POST** | Create new data | `POST /api/teams` → creates new team |
| **PATCH** | Update data | `PATCH /api/teams/1` → updates team |
| **DELETE** | Remove data | `DELETE /api/teams/1` → deletes team |

---

## Complete Endpoint Example: Teams

### 1. Create a Team (POST)

```typescript
import express, { Request, Response } from 'express';
import { prisma } from '@/utils/db';
import { authMiddleware } from '@/middleware/auth';

const router = express.Router();

// POST /api/teams
// This creates a NEW team
router.post('/teams', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Get user from JWT (authMiddleware provides this)
    const userId = req.user?.id;
    
    // 2. Get data from request body
    const { name, slug } = req.body;
    
    // 3. Validate input
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Missing required fields: name, slug'
      });
    }
    
    // 4. Save to database using Prisma
    const team = await prisma.teams.create({
      data: {
        name: name,
        slug: slug,
        company_id: userId, // Created by this user
        created_at: new Date()
      }
    });
    
    // 5. Return success response
    res.json({
      success: true,
      data: team,
      error: null
    });
    
  } catch (error) {
    // Handle errors
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to create team'
    });
  }
});

export default router;
```

**What's happening:**
1. **Line 8**: `authMiddleware` checks if user has valid JWT
2. **Line 9**: Request body data (what frontend sent)
3. **Line 11-14**: Validation (check if required fields exist)
4. **Line 17-22**: Create in database using Prisma
5. **Line 25-28**: Send back successful response
6. **Line 30-39**: Handle any errors

---

### 2. Get a Specific Team (GET)

```typescript
// GET /api/teams/1
// This fetches ONE team by ID
router.get('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Get ID from URL parameter
    const teamId = parseInt(req.params.id);
    
    // 2. Fetch from database
    const team = await prisma.teams.findUnique({
      where: { id: teamId }
    });
    
    // 3. Check if found
    if (!team) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Team not found'
      });
    }
    
    // 4. Return the team
    res.json({
      success: true,
      data: team,
      error: null
    });
    
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch team'
    });
  }
});
```

**What's different:**
- `:id` in the path means it's a parameter (e.g., `/teams/5` → id = 5)
- `findUnique` fetches ONE record
- Returns 404 if not found

---

### 3. Update a Team (PATCH)

```typescript
// PATCH /api/teams/1
// This UPDATES one team (only fields that are sent)
router.patch('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Get ID from URL
    const teamId = parseInt(req.params.id);
    
    // 2. Get update data from request body
    const { name, slug } = req.body;
    
    // 3. Verify team exists first
    const existingTeam = await prisma.teams.findUnique({
      where: { id: teamId }
    });
    
    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Team not found'
      });
    }
    
    // 4. Update in database (only fields provided)
    const updatedTeam = await prisma.teams.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),        // Only update if provided
        ...(slug && { slug }),        // Only update if provided
        updated_at: new Date()        // Always update timestamp
      }
    });
    
    // 5. Return updated team
    res.json({
      success: true,
      data: updatedTeam,
      error: null
    });
    
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update team'
    });
  }
});
```

**What's important:**
- `update` changes existing record
- `...(name && { name })` means "only include name if it was provided"
- Always update `updated_at` timestamp

---

### 4. Delete a Team (DELETE)

```typescript
// DELETE /api/teams/1
// This REMOVES a team (cannot be undone!)
router.delete('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Get ID from URL
    const teamId = parseInt(req.params.id);
    
    // 2. Verify exists
    const existingTeam = await prisma.teams.findUnique({
      where: { id: teamId }
    });
    
    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Team not found'
      });
    }
    
    // 3. Delete from database
    await prisma.teams.delete({
      where: { id: teamId }
    });
    
    // 4. Return confirmation
    res.json({
      success: true,
      data: { id: teamId, deleted: true },
      error: null
    });
    
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete team'
    });
  }
});
```

---

## HTTP Status Codes (When to Use What)

| Code | Meaning | When to Use |
|------|---------|------------|
| **200** | OK (success) | Default for successful responses |
| **201** | Created | When POST creates a new resource |
| **400** | Bad Request | Validation failed (missing fields, wrong format) |
| **401** | Unauthorized | No JWT token or invalid token |
| **403** | Forbidden | User doesn't have permission |
| **404** | Not Found | Resource doesn't exist |
| **500** | Server Error | Unexpected error (database crash, etc.) |

---

## Request Body & Query Parameters

### Request Body (for POST/PATCH)

```typescript
// Frontend sends: { name: "Engineering", slug: "eng" }
// Backend receives in req.body

router.post('/teams', async (req: Request, res: Response) => {
  const { name, slug } = req.body;
  // name = "Engineering"
  // slug = "eng"
});
```

### URL Parameters (for GET/PATCH/DELETE)

```typescript
// Frontend calls: GET /api/teams/5
// Backend receives in req.params

router.get('/teams/:id', async (req: Request, res: Response) => {
  const id = req.params.id; // "5"
  const numId = parseInt(id); // 5 (as number)
});
```

### Query Parameters (for filtering)

```typescript
// Frontend calls: GET /api/work-signals?from=2024-03-01&to=2024-03-31
// Backend receives in req.query

router.get('/work-signals', async (req: Request, res: Response) => {
  const { from, to } = req.query;
  // from = "2024-03-01"
  // to = "2024-03-31"
});
```

---

## Error Handling Pattern (ALWAYS USE THIS)

```typescript
router.get('/teams/:id', async (req: Request, res: Response) => {
  try {
    // Your code here
    const team = await prisma.teams.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ success: true, data: team, error: null });
    
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching team:', error);
    
    // Never send the actual error to frontend
    // (It might expose database structure)
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch team'
    });
  }
});
```

**Important:**
- `try` block: Your normal code
- `catch` block: When something goes wrong
- Never expose the actual error message to frontend
- Always log errors for debugging

---

## Middleware (Processing Before Endpoint)

Middleware runs BEFORE your endpoint handler.

```typescript
// Example: Authentication Middleware
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    // 1. Get JWT token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Missing authorization token'
      });
    }
    
    // 2. Verify token with Clerk
    const verifiedToken = await verifyToken(token);
    
    // 3. Attach user to request so endpoint can access it
    req.user = verifiedToken.user;
    
    // 4. Call next() to continue to endpoint
    next();
    
  } catch (error) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid token'
    });
  }
};

// Now use middleware in endpoint:
router.get('/teams/:id', authMiddleware, async (req: Request, res: Response) => {
  // At this point, req.user is already set by middleware
  const userId = req.user.id;
  // ... rest of endpoint
});
```

**How it works:**
1. Request comes in
2. Middleware runs first
3. Middleware calls `next()` if valid
4. Endpoint handler runs
5. Response sent back

---

## Complete Server Setup

```typescript
// src/index.ts

import express, { Express } from 'express';
import cors from 'cors';
import { prisma } from './utils/db';

import teamsRouter from './routes/teams';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from Vercel frontend
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api', teamsRouter);
app.use('/api', usersRouter);
app.use('/api', projectsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Testing an Endpoint (Using curl in terminal)

### GET Request
```bash
curl -X GET "http://localhost:3001/api/teams/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST Request
```bash
curl -X POST "http://localhost:3001/api/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Engineering","slug":"eng"}'
```

### PATCH Request
```bash
curl -X PATCH "http://localhost:3001/api/teams/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Backend Team"}'
```

### DELETE Request
```bash
curl -X DELETE "http://localhost:3001/api/teams/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Common Mistakes to Avoid

❌ **Don't do this:**
```typescript
// BAD: Exposing database error
catch (error) {
  res.status(500).json({
    error: error.message  // Danger! Shows database structure
  });
}
```

✅ **Do this instead:**
```typescript
// GOOD: Generic error message
catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Failed to process request'
  });
}
```

---

❌ **Don't do this:**
```typescript
// BAD: No validation
router.post('/teams', async (req: Request, res: Response) => {
  const { name } = req.body;
  // What if name is undefined?
});
```

✅ **Do this instead:**
```typescript
// GOOD: Validate input
router.post('/teams', async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'Team name is required'
    });
  }
});
```

---

## Summary

- **Endpoints** are functions that handle HTTP requests
- **Always use** try/catch for errors
- **Always validate** input
- **Always return** the standard JSON format
- **Always authenticate** with middleware
- **Use correct** HTTP status codes
- **Never expose** internal errors to frontend

You now understand how to build REST APIs! 🎉

