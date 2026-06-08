# API & Data Flow

This document maps the journey of data through the Work Management feature, explaining how user actions translate into persistent changes and real-time updates across clients.

## High-Level Sequence

The standard flow for any mutation (Create, Update, Delete, Move) follows this pattern:

```txt
User action (e.g., click "Create Task")
→ React Component (TaskCreateEditModal) validates local form state
→ Payload Builder (workManagementPayloads.ts) sanitizes the payload
→ React Query Mutation (useTaskMutations.ts) triggers the API request
→ API Controller -> Service validates via Zod and executes Prisma transaction
→ Database persists the change
→ API Service emits Socket event to the board's room
→ Local React Query `onSuccess` handles optimistic updates or invalidations
→ Other connected clients receive Socket event via `useBoardRealtime`
→ Other clients patch their local React Query cache
→ UI refreshes seamlessly across all clients
```

## Specific Flows

### 1. Board Loading Flow
When a user navigates to a board:
1. `useBoardDetail` triggers an HTTP GET to `/api/work-management/boards/:id`.
2. The backend retrieves the board, its columns, and all nested tasks via Prisma.
3. React Query caches the `BoardDetailDTO`.
4. The `BoardPage` mounts and calls `useBoardRealtime(boardId)`.
5. The socket emits `JOIN_BOARD` to subscribe to real-time events for that specific room.

### 2. Task Creation Flow
1. User clicks "Add Task" in a specific column.
2. `TaskCreateEditModal` opens. The target `columnId` is already known.
3. Upon submit, the payload is sanitized (e.g., removing invalid `assigneeIds`).
4. `createTask.mutate` sends POST to `/api/work-management/boards/:boardId/tasks`.
5. Backend validates, creates the task, and attaches assignees.
6. Backend emits `TASK_CREATED` event.
7. Local client closes modal; React Query invalidates or patches.

### 3. Task Move (Drag & Drop) Flow
1. User drags a `TaskCard` and drops it in a new column or a new order.
2. `@dnd-kit` triggers `onDragEnd`.
3. `moveTask.mutate` sends PATCH to `/api/work-management/tasks/:id/move`.
4. The payload contains the new `columnId` and the new `order` index.
5. The backend executes a complex transaction to recalculate the `order` integers for surrounding tasks to prevent collisions.
6. Backend emits `TASK_MOVED`.
7. Due to the complexity of ordering, clients listening to `TASK_MOVED` invalidate the entire board query rather than attempting a complex manual cache patch.

## Critical Safeguards

To maintain data integrity, several rules are enforced before data reaches the API:

*   **Never send `assigneeIds: [null]`:** The frontend filters the assignee array explicitly. If unassigned, an empty array `[]` is sent.
*   **Validate `columnId`:** Task creation payloads must definitively include the target column. The UI prevents opening the creation modal "into the void."
*   **Prevent Bad Payloads:** Zod schemas in `packages/shared` dictate the exact shape of `CreateTaskInput`. The API rejects oversized strings (e.g., title > 200 chars) before touching the database.