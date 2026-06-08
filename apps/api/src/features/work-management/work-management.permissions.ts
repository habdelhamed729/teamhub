import { prisma } from '../../database/prisma';
import { ForbiddenError, NotFoundError } from './work-management.errors';

export const checkBoardAccess = async (boardId: string, userId: string) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: {
            where: { user_id: userId }
          }
        }
      }
    }
  });

  if (!board) throw new NotFoundError('Board not found');
  if (board.workspace.members.length === 0) throw new ForbiddenError();

  return board;
};

export const checkColumnAccess = async (columnId: string, userId: string) => {
  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId },
    include: {
      board: {
        include: {
          workspace: {
            include: {
              members: {
                where: { user_id: userId }
              }
            }
          }
        }
      }
    }
  });

  if (!column) throw new NotFoundError('Column not found');
  if (column.board.workspace.members.length === 0) throw new ForbiddenError();

  return column;
};

export const checkTaskAccess = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: {
        include: {
          workspace: {
            include: {
              members: {
                where: { user_id: userId }
              }
            }
          }
        }
      }
    }
  });

  if (!task) throw new NotFoundError('Task not found');
  if (task.board.workspace.members.length === 0) throw new ForbiddenError();

  return task;
};

export const isWorkspaceMember = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: userId
      }
    }
  });

  return !!membership;
};
