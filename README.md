# TeamHub

A modern, high-performance platform for workspace collaboration and team management.

## 🚀 Project Overview

TeamHub is a full-stack monorepo application designed for seamless team coordination. It features a robust permission system, premium profile customization, and secure workspace management.

### Features
- **Profile Management**: Customizable display names and premium abstract avatars (DiceBear).
- **Workspace Coordination**: Secure workspace creation, member management, and unique validation.
- **Unified Auth**: JWT-based authentication with secure refresh token rotation.
- **Real-Time Messaging**: Live channel and DM chat with socket-powered delivery, optimistic UI, and cursor-based pagination.

## 🛠️ Tech Stack
- **Frontend**: React (Next.js), TanStack Query, Zustand, Tailwind CSS.
- **Backend**: Node.js (Express), Prisma ORM, PostgreSQL.
- **Shared Package**: Centralized Zod types and schemas across the monorepo.

## 📦 Getting Started

Follow these steps in order to set up and run the entire project (Frontend, Express Gateway, and Python AI Service) locally:

### 1. Prerequisites
- **Node.js** (v18+) & **pnpm** (v8+)
- **Python** (v3.11+)
- **PostgreSQL** instance (ensure the `pgvector` extension is enabled on your DB server)

---

### 2. Setup Guide

#### **Step 1: Install Node.js Dependencies**
Run this from the project root to install monorepo packages:
```bash
pnpm install
```

#### **Step 2: Configure Environment Variables (`.env`)**
You need to set up environment configurations for both services:
1. **API Gateway**: Copy `apps/api/.env.example` to `apps/api/.env` and update the values.
2. **AI Microservice**: Copy `apps/ai/.env.example` to `apps/ai/.env` and configure database connection URLs and LLM keys.

#### **Step 3: Setup Python Environment for AI Service**
Navigate to `apps/ai` and configure the virtual environment:
```bash
cd apps/ai

# 1. Create the virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# 3. Install required Python packages
pip install -e ".[dev]"

# Return to root directory
cd ../..
```

#### **Step 4: Run Database Migrations**
Apply backend relational tables and AI vector database tables:
```bash
# 1. Run API Prisma migrations (from project root)
pnpm prisma:migrate

# 2. Run Alembic migrations for AI (from apps/ai with active venv, or via path)
# From apps/ai:
alembic upgrade head
```

#### **Step 5: Run the Project**
You need **two terminals** to run everything:

**Terminal 1 — API Gateway + Web Frontend** (from project root):
```bash
pnpm dev
```

**Terminal 2 — AI FastAPI Service** (from `apps/ai` with venv activated):
```bash
cd apps/ai

# Activate the virtual environment first:
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Start the AI server:
uvicorn app.main:app --reload --port 8000
```

Once running, access the services at:
- Frontend Web App: [http://localhost:5173](http://localhost:5173)
- Express API Gateway: [http://localhost:3000](http://localhost:3000)
- AI FastAPI Service Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## 👥 Team Distribution

| Member | Ownership Area | Main Goal | Details Page |
| --- | --- | --- | --- |
| Mazen Raafat | Auth + Workspace + App Shell | Build product foundation | [🔐 Mazen Raafat — Product Foundation](file:///d:/Full-Stack%20Projects/teamhub/docs/Mazen%20Raafat/README.md) |
| Hassan Muhammad | Members + Roles + Channels | Build collaboration structure | [👥 Hassan Muhammad](file:///d:/Full-Stack%20Projects/teamhub/docs/Hassan_Muhammad/TeamHub_API_Collection.json) |
| Moamen Soltan | Real-Time Chat + Chat Files | Build live communication | Real-Time Communication: Chat, Mentions, Reactions, File Attachments |
| Shawky Elsayed | Boards + Tasks + Task Alerts | Build work management | ✅ Shawky Elsayed — Work Management: Boards, Tasks, Comments, Task Alerts |
| Hassan Abdelhamed (M5) | Documents + Uploads + AI + QA | Build knowledge/files/AI/integration | [🤖 Hassan Abdelhamed — Knowledge, Files, AI, Notifications](file:///d:/Full-Stack%20Projects/teamhub/docs/Hassan%20Abdelhamed/README.md) |

## 🛠️ Database Management

The database schema and Prisma configuration are located in `apps/api/prisma`.

### Prisma Studio
To visually explore and edit your database data, run:
```bash
# From the root directory:
pnpm --filter @teamhub/api exec prisma studio
```

### Database Migrations
```bash
# To apply API database migrations:
pnpm prisma:migrate

# To apply AI service database migrations (Run inside apps/ai/):
alembic upgrade head
```
