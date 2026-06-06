export const workManagementQueryKeys = {
  all: ['work-management'] as const,
  boards: (workspaceId: string) => [...workManagementQueryKeys.all, 'boards', workspaceId] as const,
  boardDetail: (boardId: string) => [...workManagementQueryKeys.all, 'board-detail', boardId] as const,
  task: (taskId: string) => [...workManagementQueryKeys.all, 'task', taskId] as const,
  taskComments: (taskId: string) => [...workManagementQueryKeys.all, 'task-comments', taskId] as const,
};
