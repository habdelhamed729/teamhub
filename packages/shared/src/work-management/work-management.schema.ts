import { z } from 'zod';

// ─── Shared Base Schemas ───────────────────────────────────────────────────────

export const taskIdSchema = z.string().uuid();
export const boardIdSchema = z.string().uuid();
export const columnIdSchema = z.string().uuid();
export const workspaceIdSchema = z.string().uuid();
export const userIdSchema = z.string().uuid();

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// ─── Board Schemas ────────────────────────────────────────────────────────────

export const createBoardSchema = z.object({
  workspaceId: workspaceIdSchema,
  name: z.string().min(1, 'Board name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100).optional(),
  description: z.string().max(500).optional(),
});

// ─── Column Schemas ───────────────────────────────────────────────────────────

export const createColumnSchema = z.object({
  boardId: boardIdSchema,
  name: z.string().min(1, 'Column name is required').max(50),
  order: z.number().int().nonnegative().optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50).optional(),
  order: z.number().int().nonnegative().optional(),
});

// ─── Task Schemas ─────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  columnId: columnIdSchema,
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: taskPrioritySchema.default('medium'),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeIds: z.array(userIdSchema).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const moveTaskSchema = z.object({
  columnId: columnIdSchema,
  order: z.number().int().nonnegative(),
});

// ─── Comment Schemas ──────────────────────────────────────────────────────────

export const createTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
});
