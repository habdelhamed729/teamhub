import { Request, Response } from 'express';
import * as MembersService from './members.service';
import { sendSuccess, sendError } from '../../utils/response';

export const listMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const members = await MembersService.listMembers(workspaceId);
    sendSuccess(res, { members });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const actorId = req.user!.sub;
    const { userId, role } = req.body;
    const membership = await MembersService.addMember(actorId, workspaceId, userId, role);
    sendSuccess(res, { membership }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const actorId = req.user!.sub;
    const userId = req.params['userId']!;
    const { role } = req.body;
    const updated = await MembersService.updateMemberRole(actorId, workspaceId, userId, role);
    sendSuccess(res, { membership: updated });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const actorId = req.user!.sub;
    const userId = req.params['userId']!;
    await MembersService.removeMember(actorId, workspaceId, userId);
    sendSuccess(res, { message: 'Member removed' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
