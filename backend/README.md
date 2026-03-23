# AI Co-Founder Backend - MVP Prototype 🚀

This is the official production-ready backend for the **AI Co-Founder MVP**. Built with **Node.js, TypeScript, Express, Prisma, and Agenda.js**.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Scheduler**: Agenda.js
- **Auth**: Clerk (JWT Verification)
- **Deployment**: Render / Docker

---

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Project Structure](#project-structure)
5. [API Endpoints](#api-endpoints)
6. [Scheduled Jobs](#scheduled-jobs)
7. [Deployment](#deployment)

---

## 🚀 Features

- **Passive Productivity Tracking**: Real-time signal analysis (GitHub/Slack).
- **Health Score Calc**: Weighted overall fitness snapshot updated daily.
- **Bottleneck Detection**: Track stalled items (blockers) with intensity levels.
- **Digital Twin**: Map company structure and dependencies for risk analysis.

---

## 🔐 Prerequisites

- **Node.js**: v18 or higher.
- **PostgreSQL**: Running instance (e.g., Render Postgres).
- **MongoDB**: Required for Agenda.js job persistence (e.g., MongoDB Atlas).
- **Clerk**: Publishable and Secret keys for authentication.

---

## 📦 Installation

1. **Clone the repository**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys.
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```bash
backend/
├── src/
│   ├── index.ts        # Entry point
│   ├── middleware/     # Auth, Error, Logger
│   ├── routes/         # Feature-wise API routes
│   ├── services/       # Core business logic
│   ├── jobs/           # Scheduled automation
│   ├── utils/          # Database, Auth, Metrics helpers
│   └── types/          # TS interfaces
├── prisma/
│   └── schema.prisma   # Database schema
├── .env.example
├── Dockerfile          # For Render
└── package.json
```

---

## 📡 API Endpoints (35 Active)

Full endpoint specifications can be found in `ANTI_GRAVITY_BACKEND_PROMPT.md`.

---

## ⏰ Scheduled Jobs

- **Slack Sync**: Hourly fetch of messages for all active teams.
- **GitHub Sync**: Hourly fetch of activity for linked users.
- **Health Score**: Daily calculation of team health at 2:00 AM UTC.

---

## ☁️ Deployment (Render)

1. Connect your GitHub repository to **Render**.
2. Create a **Web Service** for this backend.
3. Add **PostgreSQL** and **MongoDB** add-ons.
4. Set the environment variables from your `.env`.
5. Deploy using the included `Dockerfile`.

---

## ✅ Success Criteria

- All 35 endpoints return consistent JSON.
- Database queries under 200ms.
- Jobs run automatically without user interaction.
- JWT verification required for all feature endpoints.

---

**Built with ❤️ for AI Co-Founder**  
*Documenting execution health, one signal at a time.*
