/**
 * Socket event constants for the work management (boards/tasks) layer.
 *
 * Usage (server emit):
 *   io.to(`board:${boardId}`).emit(WorkManagementEvents.TASK_CREATED, payload);
 *
 * Usage (client listen):
 *   socket.on(WorkManagementEvents.TASK_CREATED, handler);
 */
export const WorkManagementEvents = {
  // ── Task Lifecycle ─────────────────────────────────────────
  /** Server → clients in board room: a new task was created */
  TASK_CREATED: 'TASK_CREATED',

  /** Server → clients in board room: a task was updated */
  TASK_UPDATED: 'TASK_UPDATED',

  /** Server → clients in board room: a task was moved to a different column or order */
  TASK_MOVED: 'TASK_MOVED',

  /** Server → clients in board room: a task was deleted */
  TASK_DELETED: 'TASK_DELETED',

  // ── Assignments ────────────────────────────────────────────
  /** Server → clients in board room: a user was assigned/unassigned from a task */
  TASK_ASSIGNED: 'TASK_ASSIGNED',

  // ── Comments ───────────────────────────────────────────────
  /** Server → clients in board room: a new comment was added to a task */
  TASK_COMMENT_CREATED: 'TASK_COMMENT_CREATED',

  /** Server → clients in board room: a task comment was deleted */
  TASK_COMMENT_DELETED: 'TASK_COMMENT_DELETED',

  // ── Room Management (client → server) ─────────────────────
  /** Client tells server to join a board room: `board:{id}` */
  JOIN_BOARD: 'JOIN_BOARD',

  /** Client tells server to leave a board room */
  LEAVE_BOARD: 'LEAVE_BOARD',
} as const;

/** Union type of all work management event name strings */
export type WorkManagementEvent = (typeof WorkManagementEvents)[keyof typeof WorkManagementEvents];

/** Helper to generate room names consistently */
export const WorkManagementRooms = {
  board: (boardId: string) => `board:${boardId}`,
  workspace: (workspaceId: string) => `workspace:${workspaceId}:work`,
};
