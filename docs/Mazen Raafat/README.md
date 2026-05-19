# TeamHub Backend Implementation — Mazen Raafat

This directory contains the documentation and API collection for the TeamHub foundation (Member 1).

## Accomplishments

### 1. Unified Auth System
- **Registration & Login**: Secure password hashing with `bcrypt`.
- **JWT Session Management**: 
  - Short-lived Access Tokens (passed in `Authorization` header).
  - Long-lived Refresh Tokens (stored in `httpOnly` secure cookies).
  - **Refresh Token Rotation**: Every refresh invalidates the old token and issues a new pair, preventing replay attacks.
- **Middleware**: `requireAuth` for protecting private routes.

### 2. Workspace Core
- **CRUD Operations**: Complete support for Listing, Creating, Retrieving, Updating, and Deleting workspaces.
- **Name & Slug Validation**: Implemented strict uniqueness checks for both workspace names and slugs.
- **Automatic Membership**: Creating a workspace automatically assigns the creator as the `owner`.

### 3. User Profile Management
- **Profile Endpoints**: Dedicated `GET /users/me` and `PATCH /users/me` endpoints for profile management.
- **Improved Persistence**: Enhanced the `updateMe` endpoint to correctly handle and return `avatar_url` (Premium DiceBear avatars).
- **Validation**: Sanitized input handling for display names and avatar URLs.

### 4. Shared Package Integration
- Centralized **Zod Schemas** for request validation.
- Shared **TypeScript Types** across frontend and backend.

## Tech Stack
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Security**: JWT, bcrypt, helmet, cookie-parser
- **Validation**: Zod (shared package)

---

## How to Test
1.  **Configure .env**: Ensure `apps/api/.env` has `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
2.  **Start DB**: `pnpm prisma:migrate` (if not done).
3.  **Run Server**: `pnpm dev` in `apps/api`.
4.  **Postman**: Import the `TeamHub_API_Collection.json` found in this folder.
