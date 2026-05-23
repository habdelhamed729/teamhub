import { Request, Response } from 'express';
import * as MessagesService from './messages.service';
import { sendSuccess, sendError } from '../../utils/response';

// ─── Messages ────────────────────────────────────────────────────────────────

/** GET /channels/:channelId/messages?cursor=&limit= */
export const listMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as { channelId: string };
    const cursor = req.query['cursor'] as string | undefined;
    const limit = req.query['limit'] ? Number(req.query['limit']) : 30;

    const result = await MessagesService.listMessages(channelId, req.user!.sub, cursor, limit);
    sendSuccess(res, result);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

/** POST /channels/:channelId/messages */
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params as { channelId: string };
    const { content, parentMessageId, attachmentIds } = req.body;

    const message = await MessagesService.createMessage(channelId, req.user!.sub, {
      content,
      parentMessageId,
      attachmentIds,
    });
    sendSuccess(res, { message }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

/** PATCH /messages/:messageId */
export const updateMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { content } = req.body;

    const message = await MessagesService.updateMessage(messageId, req.user!.sub, content);
    sendSuccess(res, { message });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

/** DELETE /messages/:messageId */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as { messageId: string };

    await MessagesService.deleteMessage(messageId, req.user!.sub);
    sendSuccess(res, { message: 'Message deleted' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

// ─── Reactions ───────────────────────────────────────────────────────────────

/** POST /messages/:messageId/reactions */
export const addReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { emoji } = req.body;

    await MessagesService.addReaction(messageId, req.user!.sub, emoji);
    sendSuccess(res, { message: 'Reaction added' }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

/** DELETE /messages/:messageId/reactions/:emoji */
export const removeReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId, emoji } = req.params as { messageId: string; emoji: string };

    await MessagesService.removeReaction(messageId, req.user!.sub, emoji);
    sendSuccess(res, { message: 'Reaction removed' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

// ─── Replies / Threads ────────────────────────────────────────────────────────

/** GET /messages/:messageId/replies?cursor=&limit= */
export const listReplies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as { messageId: string };
    const cursor = req.query['cursor'] as string | undefined;
    const limit = req.query['limit'] ? Number(req.query['limit']) : 30;

    const result = await MessagesService.listReplies(messageId, req.user!.sub, cursor, limit);
    sendSuccess(res, result);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

/** POST /messages/:messageId/replies */
export const createReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { content, attachmentIds } = req.body;

    const reply = await MessagesService.createReply(messageId, req.user!.sub, {
      content,
      attachmentIds,
    });
    sendSuccess(res, { message: reply }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
