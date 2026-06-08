# Feature Documentation: Work Management

This document provides a user-centric overview of the Flowly Work Management capabilities, detailing how teams can organize, track, and collaborate on their projects.

## Overview
The Work Management module is the central hub for task execution in Flowly. It provides a visual, real-time Kanban board system that allows teams to map out their workflows, assign responsibilities, and monitor progress without needing to refresh the page.

## Key Features

### 1. Project Boards
Boards are the top-level containers for work. Teams can create multiple boards within a workspace to separate different projects, sprints, or departments.
- **Boards Page:** Displays a grid of all available boards with creation dates.
- **Board Detail Page:** The main Kanban view where the actual work happens. Includes board settings to update the name/description or permanently delete the board.

### 2. Kanban Columns
Columns represent the stages of a workflow (e.g., "To Do", "In Progress", "Done").
- Users can create custom columns to match their team's specific process.
- Columns can be renamed or deleted.
- **Mobile Experience:** On smaller screens, the horizontal scroll is replaced by a "Focus Mode." A tab switcher at the top allows users to view one column at a time, preventing overwhelming, cramped layouts on mobile devices.

### 3. Task Cards
Tasks are the individual pieces of work that move through the columns.
- **Visual Indicators:** Task cards display the title, a snippet of the description, priority badges, due dates, and assignee avatars.
- **Overdue States:** If a task's due date has passed, it visually highlights in red to draw immediate attention.
- **Drag & Drop:** Users can smoothly drag tasks between columns to update their status.

### 4. Task Detail Panel
Clicking on a task opens a sliding detail panel on the right side of the screen.
- **Deep-Linking:** When a task is opened, the browser URL updates (e.g., `?task=uuid`). This allows users to copy the link and share a specific task directly with colleagues. If the link is invalid, the app gracefully recovers.
- **Rich Context:** The panel shows the full description, creation/update timestamps, and allows editing of all metadata.
- **Move Menu:** For users on touch devices where drag-and-drop might be difficult, the panel header includes a safe "Move to..." dropdown menu to easily transfer the task to another column.

### 5. Collaboration & Metadata
Tasks support rich metadata to facilitate teamwork:
- **Assignees:** Tasks can be assigned to one or multiple workspace members. The assignee selector is searchable, easily handling large teams.
- **Priorities:** Define urgency (Low, Medium, High, Urgent).
- **Due Dates:** Set deadlines for tasks.
- **Comments:** A real-time threaded comment section allows team members to discuss the task directly within the panel.

### 6. Smart Search & Filters
As boards grow, finding specific tasks becomes crucial. The board header includes a powerful, instantaneous filter bar:
- **Search:** Quickly find tasks by title or description.
- **Filter by Priority:** Isolate high-impact items.
- **Filter by Date:** Find tasks that are "Overdue," due "Today," or due "This Week."
- **Filter by Assignee:** Quickly see tasks assigned to "Me," or filter to find "Unassigned" work.
- *Note: To prevent accidental state changes, drag-and-drop is disabled while filters are active.*

### 7. Board Command Center
A quick-glance statistics bar sits at the top of the board, giving managers an immediate read on the board's health. It tracks:
- Total Tasks
- Tasks assigned to the current user
- Overdue Tasks
- Urgent Tasks
- Tasks Due This Week
- Unassigned Tasks

### 8. Real-time Sync
The board is fully synchronized via WebSockets.
- If a colleague creates, moves, updates, or deletes a task, those changes instantly appear on your screen.
- A "Live" indicator in the top-left corner provides confidence that your connection to the team is active. If the connection drops, it will indicate "Reconnecting...".