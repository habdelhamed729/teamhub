import { Request, Response } from 'express';
import * as NotificationsService from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response';

export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const notifications = await NotificationsService.getUserNotifications(userId);
    const unreadCount = await NotificationsService.getUnreadCount(userId);
    sendSuccess(res, { notifications, unreadCount });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const notificationId = req.params['notificationId']!;
    const notification = await NotificationsService.markAsRead(notificationId, userId);
    sendSuccess(res, { notification });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    await NotificationsService.markAllAsRead(userId);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    sendError(res, e.message ?? 'Internal Server Error', e.status ?? 500);
  }
};
