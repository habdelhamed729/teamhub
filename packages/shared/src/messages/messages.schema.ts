import { z } from "zod";

export const createMessageSchema = z.object({
  channelId: z.string().uuid(),

  content: z.string().min(1).max(4000),

  parentMessageId: z.string().uuid().optional(),

  attachmentIds: z.array(z.string().uuid()).max(10).default([]),
});

export const updateMessageSchema = z.object({
  messageId: z.string().uuid(),

  content: z.string().min(1).max(4000),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});


export const messageReactionSchema = z.object({
  messageId: z.string().uuid(),

  emoji: z.string().min(1).max(32),
});

export const removeReactionSchema = z.object({
  messageId: z.string().uuid(),

  emoji: z.string().min(1).max(32),
});


export const messagePaginationSchema = z.object({
  cursor: z.string().uuid().optional(),

  limit: z.coerce.number().min(1).max(50).default(30),
});

export const typingSchema = z.object({
  channelId: z.string().uuid(),

  isTyping: z.boolean(),
});


export const mentionSchema = z.object({
  messageId: z.string().uuid(),

  mentionedUserIds: z.array(z.string().uuid()),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type MessageReactionInput = z.infer<typeof messageReactionSchema>;
export type RemoveReactionInput = z.infer<typeof removeReactionSchema>;
export type MessagePaginationInput = z.infer<typeof messagePaginationSchema>;
export type TypingInput = z.infer<typeof typingSchema>;
export type MentionInput = z.infer<typeof mentionSchema>;