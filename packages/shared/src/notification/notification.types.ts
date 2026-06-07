export type NotificationType = 'mention' | 'task_assigned' | 'channel_invite' | 'message';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string | Date;
}
