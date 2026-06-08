# Known Risks and Future Improvements

While the core Work Management features are robust and production-ready, there are several areas scoped for future enhancement or dependent on backend expansions.

## Known Risks & Considerations

- **Real-Time Sync Under Load:** Currently, the `TASK_MOVED` socket event triggers a full invalidation of the board query. This is safe for data integrity (due to complex ordering logic), but if 50+ users are rapidly moving tasks on the same board, it could cause high API traffic. Future optimization may require more complex, manual cache-patching logic on the frontend.
- **Assignee Filter Scalability:** The assignee filter dropdown currently renders all workspace members. For massive workspaces (e.g., 500+ users), this list could become unwieldy. Future iterations should implement an async-searchable select component that fetches members incrementally.
- **Mobile Drag & Drop:** While `dnd-kit` is touch-compatible, dragging complex items on small screens is inherently difficult. We mitigated this by adding the "Move to..." dropdown menu, but pure drag-and-drop on mobile remains a secondary interaction path.

## Deferred / Future Improvements (Backend Dependent)

These features were planned but deferred as they require significant architectural changes outside the frontend scope:

### 1. Task Attachments
- **Current State:** The UI has no file upload mechanism for tasks.
- **Requirement:** Before frontend implementation, the backend needs a dedicated, secure file upload service (e.g., S3/Cloudinary integration) specific to the `Task` entity, along with corresponding API endpoints (`POST /api/tasks/:id/attachments`).

### 2. Activity Timeline (Audit Log)
- **Current State:** The `TaskDetailPanel` shows basic `createdAt` and `updatedAt` timestamps.
- **Requirement:** To show a full history (e.g., "User X moved task to Done at 2:00 PM"), the backend must implement a `TaskActivity` model that records every mutation. Once the API provides `/api/tasks/:id/activity`, the frontend can render a rich timeline.

### 3. Full User Presence
- **Current State:** We show a generic "Live" indicator when the socket connects.
- **Requirement:** To show *who* is currently viewing the board (e.g., floating avatars), the backend socket implementation needs to broadcast and maintain a list of active users in the `JOIN_BOARD` room.

## Suggested Next Phase
Once the backend models for `TaskActivity` and Attachments are complete, the immediate next frontend phase should focus on integrating those APIs into the `TaskDetailPanel` to bring it to feature parity with enterprise tools like Jira or Asana.