import type { User } from '../auth';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface BoardDTO {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BoardColumnDTO {
  id: string;
  boardId: string;
  name: string;
  order: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TaskAssigneeDTO {
  userId: string;
  user: User;
  assignedAt: string | Date;
}

export interface TaskDTO {
  id: string;
  columnId: string;
  boardId: string;
  creatorId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  order: number;
  dueDate?: string | Date | null;
  assignees: TaskAssigneeDTO[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TaskCommentDTO {
  id: string;
  taskId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BoardDetailDTO extends BoardDTO {
  columns: (BoardColumnDTO & {
    tasks: TaskDTO[];
  })[];
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateBoardInput {
  workspaceId: string;
  name: string;
  description?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
}

export interface CreateColumnInput {
  boardId: string;
  name: string;
  order?: number;
}

export interface UpdateColumnInput {
  name?: string;
  order?: number;
}

export interface CreateTaskInput {
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
}

export interface MoveTaskInput {
  columnId: string;
  order: number;
}

export interface CreateTaskCommentInput {
  content: string;
}

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface TaskCreatedEventPayload {
  task: TaskDTO;
  boardId: string;
  workspaceId: string;
}

export interface TaskUpdatedEventPayload {
  task: TaskDTO;
  boardId: string;
  workspaceId: string;
}

export interface TaskMovedEventPayload {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  newOrder: number;
  boardId: string;
  workspaceId: string;
}

export interface TaskAssignmentEventPayload {
  taskId: string;
  userId: string;
  action: 'assigned' | 'unassigned';
  boardId: string;
  workspaceId: string;
}

export interface TaskCommentCreatedEventPayload {
  comment: TaskCommentDTO;
  taskId: string;
  boardId: string;
  workspaceId: string;
}
