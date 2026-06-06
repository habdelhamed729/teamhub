export const NotificationEvents = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
} as const;

export type NotificationEvent = (typeof NotificationEvents)[keyof typeof NotificationEvents];
