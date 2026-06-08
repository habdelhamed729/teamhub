import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { attachWorkspaceContext } from '../../middleware/attachWorkspaceContext';
import { validate } from '../../middleware/validate';
import { workManagementController } from './work-management.controller';
import { 
  createBoardSchema, 
  updateBoardSchema, 
  createColumnSchema, 
  updateColumnSchema, 
  createTaskSchema, 
  updateTaskSchema, 
  moveTaskSchema, 
  createTaskCommentSchema 
} from '@teamhub/shared';

const router = Router();

router.use(requireAuth);

// ─── Boards ─────────────────────────────────────────────────────────────────

// GET /workspaces/:workspaceId/boards
router.get('/workspaces/:workspaceId/boards', attachWorkspaceContext, workManagementController.getBoards);

// POST /workspaces/:workspaceId/boards
router.post('/workspaces/:workspaceId/boards', attachWorkspaceContext, validate(createBoardSchema), workManagementController.createBoard);

// GET /boards/:boardId
router.get('/boards/:boardId', workManagementController.getBoardDetail);

// PATCH /boards/:boardId
router.patch('/boards/:boardId', validate(updateBoardSchema), workManagementController.updateBoard);

// DELETE /boards/:boardId
router.delete('/boards/:boardId', workManagementController.deleteBoard);

// ─── Columns ────────────────────────────────────────────────────────────────

// POST /boards/:boardId/columns
router.post('/boards/:boardId/columns', validate(createColumnSchema), workManagementController.addColumn);

// PATCH /columns/:columnId
router.patch('/columns/:columnId', validate(updateColumnSchema), workManagementController.updateColumn);

// DELETE /columns/:columnId
router.delete('/columns/:columnId', workManagementController.deleteColumn);

// ─── Tasks ──────────────────────────────────────────────────────────────────

// POST /columns/:columnId/tasks
router.post('/columns/:columnId/tasks', validate(createTaskSchema), workManagementController.addTask);

// GET /tasks/:taskId
router.get('/tasks/:taskId', workManagementController.getTask);

// PATCH /tasks/:taskId
router.patch('/tasks/:taskId', validate(updateTaskSchema), workManagementController.updateTask);

// DELETE /tasks/:taskId
router.delete('/tasks/:taskId', workManagementController.deleteTask);

// PATCH /tasks/:taskId/move
router.patch('/tasks/:taskId/move', validate(moveTaskSchema), workManagementController.moveTask);

// ─── Comments ───────────────────────────────────────────────────────────────

// GET /tasks/:taskId/comments
router.get('/tasks/:taskId/comments', workManagementController.getComments);

// POST /tasks/:taskId/comments
router.post('/tasks/:taskId/comments', validate(createTaskCommentSchema), workManagementController.addComment);

export { router as workManagementRouter };
