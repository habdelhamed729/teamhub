import { Request, Response } from 'express';
import * as WorkspaceService from './workspace.service';
import { sendSuccess, sendError } from '../../utils/response';

// POST /workspaces
export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await WorkspaceService.createWorkspace(req.user!.sub, req.body);
    sendSuccess(res, { workspace }, 201);
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};

// GET /workspaces
export const listWorkspaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaces = await WorkspaceService.listWorkspaces(req.user!.sub);
    sendSuccess(res, { workspaces });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};

// GET /workspaces/:workspaceId
export const getWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await WorkspaceService.getWorkspace(
      req.params['workspaceId']!,
      req.user!.sub,
    );
    sendSuccess(res, { workspace });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};

// PATCH /workspaces/:workspaceId
export const updateWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await WorkspaceService.updateWorkspace(
      req.params['workspaceId']!,
      req.user!.sub,
      req.body,
    );
    sendSuccess(res, { workspace });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};

// DELETE /workspaces/:workspaceId

export const deleteWorkspace = async (req: Request, res: Response): Promise<void> => {
  try {
    await WorkspaceService.deleteWorkspace(req.params['workspaceId']!, req.user!.sub);
    sendSuccess(res, { message: 'Workspace deleted successfully' });
  } catch (err: any) {
    sendError(res, err.message, err.status ?? 500);
  }
};




