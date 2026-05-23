/**
 * Socket event constants for the real-time chat layer.
 *
 * Usage (server emit):
 *   io.to(`channel:${channelId}`).emit(MessageEvents.MESSAGE_RECEIVED, payload);
 *
 * Usage (client listen):
 *   socket.on(MessageEvents.MESSAGE_RECEIVED, handler);
 */
export const MessageEvents = {
  // ── Message lifecycle ──────────────────────────────────────
  /** Server → clients in channel room: a new message was created */
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',

  /** Server → clients in channel room: a message was edited */
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',

  /** Server → clients in channel room: a message was deleted */
  MESSAGE_DELETED: 'MESSAGE_DELETED',

  // ── Typing indicator ───────────────────────────────────────
  /** Client → server AND server → other clients in channel room */
  USER_TYPING: 'USER_TYPING',

  // ── Reactions ─────────────────────────────────────────────
  /** Server → clients in channel room: reaction added to a message */
  REACTION_ADDED: 'REACTION_ADDED',

  /** Server → clients in channel room: reaction removed from a message */
  REACTION_REMOVED: 'REACTION_REMOVED',

  // ── Mentions ──────────────────────────────────────────────
  /** Server → specific user room: user was mentioned in a message */
  MENTION_CREATED: 'MENTION_CREATED',

  // ── Room management (client → server) ─────────────────────
  /** Client tells server to join a channel room: `channel:{id}` */
  JOIN_CHANNEL: 'JOIN_CHANNEL',

  /** Client tells server to leave a channel room */
  LEAVE_CHANNEL: 'LEAVE_CHANNEL',
} as const;

/** Union type of all event name strings */
export type MessageEvent = (typeof MessageEvents)[keyof typeof MessageEvents];
