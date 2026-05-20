import type { Request, Response } from 'express';
import * as ChannelsService from './channels.service';
import { sendError, sendSuccess } from '../../utils/response';

type AuthenticatedRequest = Request & { user?: { sub: string } };

export const listChannelMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workspaceId, channelId } = req.params;
    const userId = req.user!.sub;
    const members = await ChannelsService.listChannelMembers(workspaceId, channelId, userId);
    return sendSuccess(res, members);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list channel members';
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 400 : 400;
    return sendError(res, message, status);
  }
};

export const addChannelMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workspaceId, channelId } = req.params;
    const userId = req.user!.sub;
    const { userId: targetUserId } = req.body as { userId?: string };
    if (!targetUserId) return sendError(res, 'userId is required', 400);

    await ChannelsService.addChannelMember(userId, workspaceId, channelId, targetUserId);
    return sendSuccess(res, { userId: targetUserId }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add channel member';
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 400 : 400;
    return sendError(res, message, status);
  }
};