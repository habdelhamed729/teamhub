# TeamHub

A modern, high-performance platform for workspace collaboration and team management.

## 🚀 Project Overview

TeamHub is a full-stack monorepo application designed for seamless team coordination. It features a robust permission system, premium profile customization, and secure workspace management.

### Features
- **Profile Management**: Customizable display names and premium abstract avatars (DiceBear).
- **Workspace Coordination**: Secure workspace creation, member management, and unique validation.
- **Unified Auth**: JWT-based authentication with secure refresh token rotation.

## 🛠️ Tech Stack
- **Frontend**: React (Next.js), TanStack Query, Zustand, Tailwind CSS.
- **Backend**: Node.js (Express), Prisma ORM, PostgreSQL.
- **Shared Package**: Centralized Zod types and schemas across the monorepo.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (v8+)
- PostgreSQL

### Installation
```bash
# Clone the repository and install dependencies
pnpm install
```

### Running Locally
```bash
# Run all apps (web, api) in development mode
pnpm dev
```

### Database Setup
```bash
# Apply migrations to your PostgreSQL database
pnpm prisma:migrate
```

## 👥 Team Distribution


| Member | Ownership Area | Main Goal | Details Page |
| --- | --- | --- | --- |
| Mazen Raafat | Auth + Workspace + App Shell | Build product foundation | 🔐 Mazen Raafat — Product Foundation: Auth, Workspace, App Shell |
| Hassan Muhammad | Members + Roles + Channels | Build collaboration structure | 👥 Hassan Muhammad — Collaboration Structure: Members, Roles, Channels |
| Member 3 | Real-Time Chat + Chat Files | Build live communication | 💬 Member 3 — Real-Time Communication: Chat, Mentions, Chat Files |
| Member 4 | Boards + Tasks + Task Alerts | Build work management | ✅ Member 4 — Work Management: Boards, Tasks, Comments, Task Alerts |
| Member 5 | Documents + Uploads + AI + QA | Build knowledge/files/AI/integration | 🤖 Member 5 — Knowledge, Files, AI, Notifications, Integration QA |

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
# To apply migrations:
pnpm prisma:migrate
```
