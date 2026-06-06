import { prisma } from '../../database/prisma';
import { NotificationType, Prisma } from '@prisma/client';
import { getIO } from '../../config/socket';
import { NotificationEvents } from '@teamhub/shared';

// Create a notification and push it via socket in real-time
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) => {
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      type,
      title,
      body,
      data: (data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  // Push real-time notification via Socket.io
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(NotificationEvents.NOTIFICATION_RECEIVED, notification);
  } catch {
    // Socket may not be initialized in test environments — fail silently
    console.warn('Socket.io not available, skipping real-time push');
  }

  return notification;
};

// Get all notifications for a user, newest first
export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
};

// Mark a single notification as read
export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.user_id !== userId) {
    throw Object.assign(new Error('Notification not found'), { status: 404 });
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
  });
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
};

// Get unread count for badge display
export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });
};
