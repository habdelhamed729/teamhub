import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma';
import { sendError } from '../utils/response';
import { Workspace, WorkspaceRole } from '@teamhub/shared';

// Extend Express Request to carry the resolved workspace context
declare global {
  namespace Express {
    interface Request {
      workspace?: Workspace;
      workspaceRole?: WorkspaceRole;
      canManageMembers?: boolean;
      canManageChannels?: boolean;
    }
  }
}

export const attachWorkspaceContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    sendError(res, 'Workspace ID is required', 400);
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id:      req.user!.sub,
      },
    },
    include: { workspace: true },
  });

  if (!membership) {
    sendError(res, 'Workspace not found or access denied', 403);
    return;
  }

  req.workspace     = membership.workspace as unknown as Workspace;
  req.workspaceRole = membership.role as WorkspaceRole;

  // Permission helpers (owner/admin can manage members/channels)
  const canManage = ['owner', 'admin'].includes(membership.role);
  req.canManageMembers = canManage;
  req.canManageChannels = canManage;

  next();
};
