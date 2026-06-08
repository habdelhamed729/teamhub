import { getIO } from '../../config/socket';
import { WorkManagementEvents, WorkManagementRooms, NotificationEvents } from '@teamhub/shared';

export const emitTaskCreated = (boardId: string, workspaceId: string, task: any) => {
  const io = getIO();
  io.to(WorkManagementRooms.board(boardId)).emit(WorkManagementEvents.TASK_CREATED, {
    task,
    boardId,
    workspaceId,
  });
};

export const emitTaskUpdated = (boardId: string, workspaceId: string, task: any) => {
  const io = getIO();
  io.to(WorkManagementRooms.board(boardId)).emit(WorkManagementEvents.TASK_UPDATED, {
    task,
    boardId,
    workspaceId,
  });
};

export const emitTaskMoved = (payload: {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  newOrder: number;
  boardId: string;
  workspaceId: string;
}) => {
  const io = getIO();
  io.to(WorkManagementRooms.board(payload.boardId)).emit(WorkManagementEvents.TASK_MOVED, payload);
};

export const emitTaskDeleted = (payload: {
  taskId: string;
  boardId: string;
  workspaceId: string;
}) => {
  const io = getIO();
  io.to(WorkManagementRooms.board(payload.boardId)).emit(WorkManagementEvents.TASK_DELETED, payload);
};

export const emitTaskAssigned = (payload: {
  taskId: string;
  userId: string;
  action: 'assigned' | 'unassigned';
  boardId: string;
  workspaceId: string;
}) => {
  const io = getIO();
  // Emit to board room for UI updates
  io.to(WorkManagementRooms.board(payload.boardId)).emit(WorkManagementEvents.TASK_ASSIGNED, payload);
  
  // Emit to specific user room for alerts if assigned
  if (payload.action === 'assigned') {
    io.to(`user:${payload.userId}`).emit(NotificationEvents.NOTIFICATION_RECEIVED, {
      type: 'task_assigned',
      title: 'New Task Assigned',
      body: `You have been assigned to a task`,
      data: {
        taskId: payload.taskId,
        workspaceId: payload.workspaceId,
      },
    });
  }
};

export const emitTaskCommentCreated = (payload: {
  comment: any;
  taskId: string;
  boardId: string;
  workspaceId: string;
}) => {
  const io = getIO();
  io.to(WorkManagementRooms.board(payload.boardId)).emit(WorkManagementEvents.TASK_COMMENT_CREATED, payload);
};
