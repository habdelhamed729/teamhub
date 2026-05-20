import { Request, Response } from 'express';
import * as ChannelsService from './channels.service';
import { sendSuccess, sendError } from '../../utils/response';

export const listChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const channels = await ChannelsService.listChannels(workspaceId, req.user!.sub);
    sendSuccess(res, { channels });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const actorId = req.user!.sub;
    const dto = req.body;
    const channel = await ChannelsService.createChannel(actorId, workspaceId, dto);
    sendSuccess(res, { channel }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const getChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const channelId = req.params['channelId']!;
    const channel = await ChannelsService.getChannel(workspaceId, channelId, req.user!.sub);
    sendSuccess(res, { channel });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const channelId = req.params['channelId']!;
    const actorId = req.user!.sub;
    const dto = req.body;
    const updated = await ChannelsService.updateChannel(actorId, workspaceId, channelId, dto);
    sendSuccess(res, { channel: updated });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const deleteChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const channelId = req.params['channelId']!;
    const actorId = req.user!.sub;
    await ChannelsService.deleteChannel(actorId, workspaceId, channelId);
    sendSuccess(res, { message: 'Channel deleted' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const joinChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params['workspaceId']!;
    const channelId = req.params['channelId']!;
    const actorId = req.user!.sub;
    const channel = await ChannelsService.joinPublicChannel(actorId, workspaceId, channelId);
    sendSuccess(res, { channel }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
