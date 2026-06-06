import { prisma } from '../../database/prisma';
import { 
  CreateBoardInput, 
  UpdateBoardInput, 
  CreateColumnInput, 
  UpdateColumnInput, 
  CreateTaskInput, 
  UpdateTaskInput, 
  MoveTaskInput 
} from '@teamhub/shared';
import { 
  checkBoardAccess, 
  checkColumnAccess, 
  checkTaskAccess, 
  isWorkspaceMember 
} from './work-management.permissions';
import { 
  mapBoardToDTO, 
  mapBoardDetailToDTO, 
  mapColumnToDTO, 
  mapTaskToDTO, 
  mapCommentToDTO 
} from './work-management.mapper';
import { ForbiddenError, NotFoundError, ValidationError } from './work-management.errors';

export class WorkManagementService {
  // ─── Boards ─────────────────────────────────────────────────────────────────

  async getBoards(workspaceId: string, userId: string) {
    const isMember = await isWorkspaceMember(workspaceId, userId);
    if (!isMember) throw new ForbiddenError();

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' }
    });

    return boards.map(mapBoardToDTO);
  }

  async createBoard(data: CreateBoardInput, userId: string) {
    const isMember = await isWorkspaceMember(data.workspaceId, userId);
    if (!isMember) throw new ForbiddenError();

    const board = await prisma.board.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
      }
    });

    return mapBoardToDTO(board);
  }

  async getBoardDetail(boardId: string, userId: string) {
    await checkBoardAccess(boardId, userId);

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignees: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    if (!board) throw new NotFoundError('Board not found');

    return mapBoardDetailToDTO(board);
  }

  async updateBoard(boardId: string, data: UpdateBoardInput, userId: string) {
    await checkBoardAccess(boardId, userId);

    const board = await prisma.board.update({
      where: { id: boardId },
      data: {
        name: data.name,
        description: data.description,
      }
    });

    return mapBoardToDTO(board);
  }

  async deleteBoard(boardId: string, userId: string) {
    await checkBoardAccess(boardId, userId);

    await prisma.board.delete({
      where: { id: boardId }
    });
  }

  // ─── Columns ────────────────────────────────────────────────────────────────

  async addColumn(boardId: string, data: CreateColumnInput, userId: string) {
    await checkBoardAccess(boardId, userId);

    // Get max order
    const lastColumn = await prisma.boardColumn.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' }
    });

    const order = data.order ?? (lastColumn ? lastColumn.order + 1 : 0);

    const column = await prisma.boardColumn.create({
      data: {
        boardId,
        name: data.name,
        order,
      }
    });

    return mapColumnToDTO(column);
  }

  async updateColumn(columnId: string, data: UpdateColumnInput, userId: string) {
    await checkColumnAccess(columnId, userId);

    const column = await prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        name: data.name,
        order: data.order,
      }
    });

    return mapColumnToDTO(column);
  }

  async deleteColumn(columnId: string, userId: string) {
    await checkColumnAccess(columnId, userId);

    await prisma.boardColumn.delete({
      where: { id: columnId }
    });
  }

  // ─── Tasks ──────────────────────────────────────────────────────────────────

  async addTask(columnId: string, data: CreateTaskInput, userId: string) {
    const column = await checkColumnAccess(columnId, userId);

    // Validate assignees are workspace members
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      for (const assigneeId of data.assigneeIds) {
        const isMember = await isWorkspaceMember(column.board.workspaceId, assigneeId);
        if (!isMember) throw new ValidationError(`User ${assigneeId} is not a member of this workspace`);
      }
    }

    // Get max order in column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' }
    });

    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        columnId,
        boardId: column.boardId,
        creatorId: userId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        order,
        assignees: data.assigneeIds ? {
          create: data.assigneeIds.map(uid => ({ userId: uid }))
        } : undefined
      },
      include: {
        assignees: {
          include: { user: true }
        }
      }
    });

    return {
      task: mapTaskToDTO(task),
      workspaceId: column.board.workspaceId,
      boardId: column.boardId
    };
  }

  async getTask(taskId: string, userId: string) {
    await checkTaskAccess(taskId, userId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: { user: true }
        }
      }
    });

    if (!task) throw new NotFoundError('Task not found');

    return mapTaskToDTO(task);
  }

  async updateTask(taskId: string, data: UpdateTaskInput & { assigneeIds?: string[] }, userId: string) {
    const existingTask = await checkTaskAccess(taskId, userId);

    // Validate assignees if provided
    if (data.assigneeIds) {
      for (const assigneeId of data.assigneeIds) {
        const isMember = await isWorkspaceMember(existingTask.board.workspaceId, assigneeId);
        if (!isMember) throw new ValidationError(`User ${assigneeId} is not a member of this workspace`);
      }
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : (data.dueDate === null ? null : undefined),
    };

    if (data.assigneeIds) {
      updateData.assignees = {
        deleteMany: {},
        create: data.assigneeIds.map(uid => ({ userId: uid }))
      };
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignees: {
          include: { user: true }
        }
      }
    });

    return {
      task: mapTaskToDTO(task),
      workspaceId: existingTask.board.workspaceId,
      boardId: existingTask.boardId,
      assigneesChanged: !!data.assigneeIds
    };
  }

  async moveTask(taskId: string, data: MoveTaskInput, userId: string) {
    const task = await checkTaskAccess(taskId, userId);
    const targetColumn = await checkColumnAccess(data.columnId, userId);

    if (targetColumn.boardId !== task.boardId) {
      throw new ValidationError('Cannot move task to a column in a different board');
    }

    const { columnId: fromColumnId, order: oldOrder } = task;
    const { columnId: toColumnId, order: newOrder } = data;

    await prisma.$transaction(async (tx) => {
      if (fromColumnId === toColumnId) {
        // Same column reorder
        if (newOrder > oldOrder) {
          await tx.task.updateMany({
            where: {
              columnId: fromColumnId,
              order: { gt: oldOrder, lte: newOrder }
            },
            data: { order: { decrement: 1 } }
          });
        } else if (newOrder < oldOrder) {
          await tx.task.updateMany({
            where: {
              columnId: fromColumnId,
              order: { gte: newOrder, lt: oldOrder }
            },
            data: { order: { increment: 1 } }
          });
        }
      } else {
        // Cross column move
        // Shift up tasks in old column
        await tx.task.updateMany({
          where: {
            columnId: fromColumnId,
            order: { gt: oldOrder }
          },
          data: { order: { decrement: 1 } }
        });

        // Shift down tasks in new column
        await tx.task.updateMany({
          where: {
            columnId: toColumnId,
            order: { gte: newOrder }
          },
          data: { order: { increment: 1 } }
        });
      }

      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: toColumnId,
          order: newOrder
        }
      });
    });

    return {
      taskId,
      fromColumnId,
      toColumnId,
      newOrder,
      boardId: task.boardId,
      workspaceId: task.board.workspaceId
    };
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await checkTaskAccess(taskId, userId);

    await prisma.$transaction(async (tx) => {
      // Shift up tasks below deleted task in the same column
      await tx.task.updateMany({
        where: {
          columnId: task.columnId,
          order: { gt: task.order }
        },
        data: { order: { decrement: 1 } }
      });

      await tx.task.delete({
        where: { id: taskId }
      });
    });

    return {
      taskId,
      boardId: task.boardId,
      workspaceId: task.board.workspaceId
    };
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  async getComments(taskId: string, userId: string) {
    await checkTaskAccess(taskId, userId);

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });

    return comments.map(mapCommentToDTO);
  }

  async addComment(taskId: string, content: string, userId: string) {
    const task = await checkTaskAccess(taskId, userId);

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: userId,
        content,
      },
      include: { author: true }
    });

    return {
      comment: mapCommentToDTO(comment),
      taskId,
      boardId: task.boardId,
      workspaceId: task.board.workspaceId
    };
  }
}

export const workManagementService = new WorkManagementService();
