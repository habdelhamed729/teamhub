import type {User} from "../auth"

import type { Attachment } from "../attachment";

export type MessageType =
  | "TEXT"
  | "FILE"
  | "MIXED"
  | "SYSTEM";

export interface Message {
  id: string;

  channelId: string;

  sender: User;

  content: string;

  messageType: MessageType;

  parentMessageId?: string | null;

  parentMessage?: {
    id: string;
    content: string;
    sender: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
    attachments?: Attachment[];
  } | null;

  attachments: Attachment[];

  reactions: Reaction[];

  replyCount: number;

  isEdited: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

/** Returned by GET /channels/:channelId/messages and GET /messages/:messageId/replies */
export interface PaginatedMessages {
  messages: Message[];
  nextCursor: string | null;
}

/** Payload emitted with USER_TYPING socket event */
export interface TypingEvent {
  channelId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}

/** Payload emitted with REACTION_ADDED / REACTION_REMOVED socket events */
export interface ReactionEvent {
  messageId: string;
  emoji: string;
  userId: string;
}

/** Payload emitted with MENTION_CREATED socket event (user:{id} room) */
export interface MentionEvent {
  messageId: string;
  channelId: string;
  mentionedUserIds: string[];
}