# Technical Implementation

This document provides a high-level overview of the architectural decisions and technical structures used to build the Work Management feature.

## Frontend Architecture Overview
The Work Management module follows a strict feature-based architecture pattern. All related components, hooks, pages, and utilities are encapsulated within `apps/web/src/features/work-management/`. 

### State Management
- **Server State:** Handled exclusively by `@tanstack/react-query`. This provides automatic caching, background fetching, and optimistic updates.
- **Client State:** Handled via React `useState` and `useMemo` for local UI interactions (modals, active tabs, filter inputs).
- **URL State:** The `TaskDetailPanel` uses `useSearchParams` from `react-router-dom` to treat the URL query parameter (`?task=id`) as the source of truth for the currently opened task, enabling deep linking.

### Key Technologies
- **Drag and Drop:** `@dnd-kit/core` and `@dnd-kit/sortable` provide robust, accessible, and highly customizable drag-and-drop capabilities for the Kanban board.
- **Real-time:** `socket.io-client` listens to external mutations and invalidates/updates the React Query cache.
- **Styling:** Tailwind CSS with a strict adherence to predefined CSS variables.

## Key Files & Directories

### Pages
- `apps/web/src/features/work-management/pages/BoardsPage.tsx`: The grid view of all boards.
- `apps/web/src/features/work-management/pages/BoardPage.tsx`: The main Kanban layout. Orchestrates columns, tasks, drag-drop contexts, and the real-time hook.

### Core Components
- `components/BoardColumn.tsx`: Renders the column, handles empty states, and wraps the sortable context.
- `components/TaskCard.tsx`: The draggable item representing a task.
- `components/TaskDetailPanel.tsx`: A complex, responsive side-panel for deep task editing and commenting.
- `components/TaskCreateEditModal.tsx`: Form component handling creation/updates with robust payload validation.
- `components/WorkSelect.tsx`: The custom, portaled, and accessible dropdown component replacing native selects.

### Hooks
- `hooks/useBoards.ts`: React Query hooks for fetching and mutating board data.
- `hooks/useTaskMutations.ts`: Centralized hooks for creating, updating, moving, and deleting tasks.
- `hooks/useBoardRealtime.ts`: Manages the socket connection, listening for `TASK_CREATED`, `TASK_UPDATED`, etc., and safely patching the React Query cache to prevent duplication.
- `hooks/useBoardTaskFilters.ts`: Encapsulates the complex logic required to filter a board's nested array of columns and tasks client-side without mutating the original fetched data.

### Utilities & Types
- `utils/workManagementPayloads.ts`: Provides builder functions (`buildCreateTaskPayload`) to sanitize data before it hits the API. For example, ensuring empty strings are stripped from `assigneeIds`.
- `packages/shared/src/work-management/*`: Contains Zod schemas and TypeScript interfaces ensuring end-to-end type safety between the frontend and backend.

## Validation & Safeguards
- **Assignee Sanitation:** The frontend explicitly filters out `null`, `undefined`, or empty strings from the `assigneeIds` array before submission to prevent database constraint errors.
- **Column Resolution:** A task cannot be created without a valid `columnId`. The `BoardPage` resolves the target column ID before opening the creation modal.
- **DnD Safety:** Drag and drop is explicitly disabled via the `disabled` prop on the `DndContext` when any filters are active. This prevents users from accidentally sorting a filtered list, which would result in unpredictable order calculations on the backend.