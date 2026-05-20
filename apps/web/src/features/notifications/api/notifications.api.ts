import { api } from '@/shared/services/axios';
import type { Notification } from '@teamhub/shared';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await api.get('/notifications');
  return response.data.data;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};
