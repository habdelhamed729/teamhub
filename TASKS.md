## Shared Engineering Rules

- Use feature-based architecture.
- Use shared types, Zod schemas, constants, and socket events from `packages/shared`.
- All APIs must follow one response/error format.
- Use TanStack Query for server state.
- Use Zustand only for UI/local state.
- Do not hardcode role checks or socket event names.
- Every feature must include loading, empty, error, and success states.
- Each owner must document routes, payloads, dependencies, and manual QA steps.
- Merge frequently; isolated success is not product success.
- Use the available color palette in the web project


# Member 2 — Collaboration Structure: Members, Roles, Channels

## Owner Mission

Build the collaboration structure: who belongs to a workspace, what role they have, and where communication happens.

## Delivery Weight

**100 points**

| Area | Points |
| --- | --- |
| --- | ---: |
| Members/invites basics | 25 |
| Roles/permissions | 25 |
| Channels | 35 |
| Channel UI | 10 |
| QA/docs | 5 |

---

## Functional Requirements

- Workspace owner/admin can manage members.
- Member roles are supported: owner, admin, member.
- Central permission helper controls access.
- Users can create public/private channels.
- Users can create or open DM channels.
- Public channels are visible to all workspace members.
- Private channels and DMs depend on `channel_members`.

---

## Backend Scope

### Models / Tables

- `workspace_members`
- `channels`
- `channel_members`
- Uses `users` and `workspaces` from Member 1.

### Expected Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/workspaces/:workspaceId/members` | List workspace members |
| POST | `/workspaces/:workspaceId/members` | Add/invite member basic flow |
| PATCH | `/workspaces/:workspaceId/members/:userId` | Change role |
| DELETE | `/workspaces/:workspaceId/members/:userId` | Remove member |
| GET | `/workspaces/:workspaceId/channels` | List accessible channels |
| POST | `/workspaces/:workspaceId/channels` | Create channel |
| GET | `/channels/:channelId` | Get channel details |
| PATCH | `/channels/:channelId` | Update channel name/topic/type |
| DELETE | `/channels/:channelId` | Delete/archive channel |
| POST | `/channels/:channelId/members` | Add member to private channel |
| DELETE | `/channels/:channelId/members/:userId` | Remove private channel member |
| POST | `/workspaces/:workspaceId/dms` | Create/open DM channel |

### Permission Rules

| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| Manage workspace members | Yes | Yes | No |
| Remove owner | No | No | No |
| Create public channel | Yes | Yes | Yes |
| Create private channel | Yes | Yes | Yes |
| Manage channel settings | Yes | Yes | Creator/limited |
| Access public channels | Yes | Yes | Yes |
| Access private channels | If member | If member | If member |

---

## Frontend Scope

### Screens / Components

- Members page/table
- Role selector
- Add/invite member modal
- Channel sidebar list
- Create channel modal
- Channel settings modal
- DM creation/opening UI

### State / Data

- TanStack Query: members, channels, channel details.
- Zustand only for local UI modals/sidebar state.

---

## Shared Package Requirements

- Role enum.
- Permission constants.
- Channel type enum: `public`, `private`, `dm`.
- Member/channel request and response schemas.

---

## Dependencies

### Depends On

- Member 1: auth, workspace context.

### Blocks

- Member 3 needs channels before full chat.
- All private features need permission conventions.

---

## Acceptance Criteria

- Workspace members can be listed.
- Roles are visible and enforce basic permissions.
- Public/private channels can be created.
- Channel list only shows accessible channels.
- DM channel can be created/opened.
- Unauthorized channel access is blocked by backend.

---

## QA Checklist

- Member cannot manage other members.
- Admin can create/manage channels.
- Private channel is hidden from non-members.
- Public channel appears for all workspace members.
- DM channel contains correct participants.

---

## Parallel Dependency Contract

### I Must Provide Early

- Role enum: owner, admin, member.
- Permission helper contract.
- Member list response shape.
- Channel list/create response shape.
- Channel access rules for public, private, and DM channels.

### Other Members Depend On Me For

- Member 3 needs channels and channel access for chat.
- Member 4 needs workspace members for task assignees.
- Member 5 needs roles/access context for docs/uploads/notifications.

### I Depend On Others For

- Member 1: authenticated user and active workspace.
- Member 3: channel usage feedback from chat.

### What Others Can Mock Until I Finish

- Mock role enum.
- Mock members array.
- Mock channel list with public/private/dm types.

### Handoff Checklist

- Publish role/channel/member schemas in shared package.
- Confirm permission rules with all members.
- Provide seeded workspace members.
- Provide at least one public channel and one private channel for integration.