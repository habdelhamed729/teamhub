import { api } from '@/shared/services/axios';
import type { 
  BoardDTO, 
  BoardDetailDTO, 
  BoardColumnDTO, 
  TaskDTO, 
  TaskCommentDTO,
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateTaskCommentInput
} from '@teamhub/shared';

export const workManagementApi = {
  // ─── Boards ─────────────────────────────────────────────────────────────────
  listWorkspaceBoards: async (workspaceId: string): Promise<BoardDTO[]> => {
    const { data } = await api.get(`/workspaces/${workspaceId}/boards`);
    return data.data;
  },

  createBoard: async (workspaceId: string, payload: CreateBoardInput): Promise<BoardDTO> => {
    const { data } = await api.post(`/workspaces/${workspaceId}/boards`, payload);
    return data.data;
  },

  getBoardDetail: async (boardId: string): Promise<BoardDetailDTO> => {
    const { data } = await api.get(`/boards/${boardId}`);
    return data.data;
  },

  updateBoard: async (boardId: string, payload: UpdateBoardInput): Promise<BoardDTO> => {
    const { data } = await api.patch(`/boards/${boardId}`, payload);
    return data.data;
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}`);
  },

  // ─── Columns ────────────────────────────────────────────────────────────────
  createColumn: async (boardId: string, payload: CreateColumnInput): Promise<BoardColumnDTO> => {
    const { data } = await api.post(`/boards/${boardId}/columns`, payload);
    return data.data;
  },

  updateColumn: async (columnId: string, payload: UpdateColumnInput): Promise<BoardColumnDTO> => {
    const { data } = await api.patch(`/columns/${columnId}`, payload);
    return data.data;
  },

  deleteColumn: async (columnId: string): Promise<void> => {
    await api.delete(`/columns/${columnId}`);
  },

  // ─── Tasks ──────────────────────────────────────────────────────────────────
  createTask: async (columnId: string, payload: CreateTaskInput): Promise<TaskDTO> => {
    const { data } = await api.post(`/columns/${columnId}/tasks`, payload);
    return data.data;
  },

  getTaskDetail: async (taskId: string): Promise<TaskDTO> => {
    const { data } = await api.get(`/tasks/${taskId}`);
    return data.data;
  },

  updateTask: async (taskId: string, payload: UpdateTaskInput & { assigneeIds?: string[] }): Promise<TaskDTO> => {
    const { data } = await api.patch(`/tasks/${taskId}`, payload);
    return data.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  moveTask: async (taskId: string, payload: MoveTaskInput): Promise<void> => {
    await api.patch(`/tasks/${taskId}/move`, payload);
  },

  // ─── Comments ───────────────────────────────────────────────────────────────
  listTaskComments: async (taskId: string): Promise<TaskCommentDTO[]> => {
    const { data } = await api.get(`/tasks/${taskId}/comments`);
    return data.data;
  },

  createTaskComment: async (taskId: string, payload: CreateTaskCommentInput): Promise<TaskCommentDTO> => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, payload);
    return data.data;
  },
};
