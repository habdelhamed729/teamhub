import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  MessageSquare,
  UserPlus,
  Info,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import type { Notification } from "@teamhub/shared";

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate to respective workspace/channel if information is available
    const data = notification.data as {
      workspaceId?: string;
      channelId?: string;
    } | null;
    if (data?.workspaceId && data?.channelId) {
      navigate(`/workspaces/${data.workspaceId}/channels/${data.channelId}`);
    } else if (data?.workspaceId) {
      navigate(`/workspaces/${data.workspaceId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case "channel_invite":
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-text-primary transition-colors relative p-1.5 rounded-lg hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-text-muted hover:text-text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-accent text-[9px] font-bold text-white ring-2 ring-surface-secondary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-secondary/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-accent/10 text-primary-accent rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-primary-accent hover:text-primary-accent-hover font-medium flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-90 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">
                  All caught up!
                </p>
                <p className="text-xs text-text-muted mt-1 max-w-50">
                  You will see mentions, invites, and updates here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors relative group ${
                    !notification.is_read ? "bg-primary-accent/5" : ""
                  }`}
                >
                  {/* Left Icon */}
                  <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <p
                      className={`text-xs ${!notification.is_read ? "font-semibold text-text-primary" : "text-text-primary"}`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 font-medium">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread dot / Quick mark as read button */}
                  {!notification.is_read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="h-2 w-2 rounded-full bg-primary-accent group-hover:hidden" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
