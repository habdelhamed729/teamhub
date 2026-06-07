import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications.api';
import { getSocket, connectSocket, disconnectSocket } from '@/shared/services/socket';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/useAuthStore';
import { NotificationEvents } from '@teamhub/shared';
import type { Notification } from '@teamhub/shared';

export const useNotifications = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Fetch notifications (relies on WebSockets for updates, no aggressive polling)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isAuthenticated,
    staleTime: Infinity, // Rely entirely on real-time WS events to invalidate
    refetchOnWindowFocus: false, // Stop fetching on window refocus/page click
  });

  // Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      refetch();
      toast.success('All notifications marked as read');
    },
  });

  // Setup Socket connection & event listener for new notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      disconnectSocket();
      return;
    }

    // Connect socket with just the userId
    connectSocket(user.id);
    const socket = getSocket();

    const handleNewNotification = (notification: Notification) => {
      console.log('Received real-time notification:', notification);
      refetch();

      toast.info(notification.title, {
        description: notification.body,
        duration: 5000,
        action: notification.data?.channelId
          ? {
              label: 'View',
              onClick: () => {
                const data = notification.data as { workspaceId?: string; channelId?: string };
                if (data.workspaceId && data.channelId) {
                  window.location.href = `/workspaces/${data.workspaceId}/channels/${data.channelId}`;
                }
              }
            }
          : undefined,
      });
    };

    socket.on(NotificationEvents.NOTIFICATION_RECEIVED, handleNewNotification);

    return () => {
      socket.off(NotificationEvents.NOTIFICATION_RECEIVED, handleNewNotification);
    };
  }, [isAuthenticated, user?.id, refetch]);

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    refetch,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
  };
};
