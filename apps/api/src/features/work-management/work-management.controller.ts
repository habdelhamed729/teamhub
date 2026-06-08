import { Request, Response } from 'express';
import { workManagementService } from './work-management.service';
import { sendSuccess, sendError } from '../../utils/response';
import * as socketHelpers from './work-management.socket';

export class WorkManagementController {
  // ─── Boards ─────────────────────────────────────────────────────────────────

  async getBoards(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.sub;
      const boards = await workManagementService.getBoards(workspaceId, userId);
      return sendSuccess(res, boards);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async createBoard(req: Request, res: Response) {
    try {
      const userId = req.user!.sub;
      const board = await workManagementService.createBoard(req.body, userId);
      return sendSuccess(res, board, 201);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async getBoardDetail(req: Request, res: Response) {
    try {
      const { boardId } = req.params;
      const userId = req.user!.sub;
      const board = await workManagementService.getBoardDetail(boardId, userId);
      return sendSuccess(res, board);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async updateBoard(req: Request, res: Response) {
    try {
      const { boardId } = req.params;
      const userId = req.user!.sub;
      const board = await workManagementService.updateBoard(boardId, req.body, userId);
      return sendSuccess(res, board);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async deleteBoard(req: Request, res: Response) {
    try {
      const { boardId } = req.params;
      const userId = req.user!.sub;
      await workManagementService.deleteBoard(boardId, userId);
      return sendSuccess(res, { message: 'Board deleted successfully' });
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  // ─── Columns ────────────────────────────────────────────────────────────────

  async addColumn(req: Request, res: Response) {
    try {
      const { boardId } = req.params;
      const userId = req.user!.sub;
      const column = await workManagementService.addColumn(boardId, req.body, userId);
      return sendSuccess(res, column, 201);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async updateColumn(req: Request, res: Response) {
    try {
      const { columnId } = req.params;
      const userId = req.user!.sub;
      const column = await workManagementService.updateColumn(columnId, req.body, userId);
      return sendSuccess(res, column);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async deleteColumn(req: Request, res: Response) {
    try {
      const { columnId } = req.params;
      const userId = req.user!.sub;
      await workManagementService.deleteColumn(columnId, userId);
      return sendSuccess(res, { message: 'Column deleted successfully' });
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  // ─── Tasks ──────────────────────────────────────────────────────────────────

  async addTask(req: Request, res: Response) {
    try {
      const { columnId } = req.params;
      const userId = req.user!.sub;
      const { task, boardId, workspaceId } = await workManagementService.addTask(columnId, req.body, userId);
      
      socketHelpers.emitTaskCreated(boardId, workspaceId, task);
      
      return sendSuccess(res, task, 201);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const task = await workManagementService.getTask(taskId, userId);
      return sendSuccess(res, task);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const { task, workspaceId, boardId, assigneesChanged } = await workManagementService.updateTask(taskId, req.body, userId);
      
      socketHelpers.emitTaskUpdated(boardId, workspaceId, task);
      
      if (assigneesChanged) {
        // Simple implementation: emit TASK_ASSIGNED for each assignee
        // In a real app, you might want to compare diff, but here we just emit for all in the request
        if (req.body.assigneeIds) {
          for (const uid of req.body.assigneeIds) {
            socketHelpers.emitTaskAssigned({
              taskId: task.id,
              userId: uid,
              action: 'assigned',
              boardId: boardId,
              workspaceId: workspaceId,
            });
          }
        }
      }

      return sendSuccess(res, task);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async moveTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const result = await workManagementService.moveTask(taskId, req.body, userId);
      
      socketHelpers.emitTaskMoved(result);
      
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const result = await workManagementService.deleteTask(taskId, userId);
      
      socketHelpers.emitTaskDeleted(result);
      
      return sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  async getComments(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user!.sub;
      const comments = await workManagementService.getComments(taskId, userId);
      return sendSuccess(res, comments);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user!.sub;
      const result = await workManagementService.addComment(taskId, content, userId);
      
      socketHelpers.emitTaskCommentCreated(result);
      
      return sendSuccess(res, result.comment, 201);
    } catch (error: any) {
      return sendError(res, error.message, error.statusCode || 400);
    }
  }
}

export const workManagementController = new WorkManagementController();
