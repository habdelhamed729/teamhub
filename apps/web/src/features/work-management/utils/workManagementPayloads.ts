import type { CreateTaskInput, UpdateTaskInput, TaskPriority } from '@teamhub/shared';

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeIds: string[];
}

/**
 * Sanitizes and builds the payload for creating a new task.
 * Ensures columnId is included and assigneeIds are valid strings.
 */
export function buildCreateTaskPayload(columnId: string, values: TaskFormValues): CreateTaskInput {
  return {
    columnId,
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    priority: values.priority,
    dueDate: values.dueDate,
    assigneeIds: (values.assigneeIds ?? []).filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    ),
  };
}

/**
 * Sanitizes and builds the payload for updating an existing task.
 */
export function buildUpdateTaskPayload(values: TaskFormValues): UpdateTaskInput & { assigneeIds?: string[] } {
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    priority: values.priority,
    dueDate: values.dueDate,
    assigneeIds: (values.assigneeIds ?? []).filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    ),
  };
}
