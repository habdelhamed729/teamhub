import { prisma } from '../../database/prisma';
import { getIO } from '../../config/socket';
import { createNotification } from '../notifications/notifications.service';
import { MessageEvents, MentionEvent } from '@teamhub/shared';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Reusable select for the sender attached to every message */
const senderSelect = {
  id: true,
  display_name: true,
  avatar_url: true,
} as const;

/** Reusable include block shared by list / create / update queries */
const messageInclude = (viewerId: string) =>
  ({
    sender: { select: senderSelect },
    reactions: {
      select: { emoji: true, userId: true },
    },
    attachments: {
      include: {
        uploader: { select: senderSelect },
      },
    },
    parentMessage: {
      include: {
        sender: { select: senderSelect },
        attachments: {
          include: {
            uploader: { select: senderSelect },
          },
        },
      },
    },
    _count: { select: { replies: true } },
  }) as const;

/**
 * Assert that the user is a member of the channel (or it's public).
 * Returns the channel row so callers can use its workspace_id.
 */
const assertChannelAccess = async (channelId: string, userId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    throw Object.assign(new Error('Channel not found'), { status: 404 });
  }

  // Public channels are visible to any workspace member
  if (channel.type === 'public') {
    return channel;
  }

  // Creator always has access
  if (channel.created_by_id === userId) {
    return channel;
  }

  const membership = await prisma.channelMember.findUnique({
    where: {
      channel_id_user_id: { channel_id: channelId, user_id: userId },
    },
  });

  if (!membership) {
    // If the channel is not private, auto‑create a membership for legacy users
    if (channel.type !== 'private') {
      await prisma.channelMember.create({
        data: { channel_id: channelId, user_id: userId },
      });
      return channel;
    }
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  return channel;
};

/**
 * Parse @mentions from message content.
 * Supports formats: @<uuid> (programmatic) and collects unique user ids.
 * The frontend will send mentions as `@<userId>` embedded in the content.
 */
const parseMentions = (content: string): string[] => {
  const regex = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]!);
  }
  return [...ids];
};

/**
 * Transform a raw Prisma message row into the shape the client expects:
 *  – Aggregate reactions into { emoji, count, reacted }
 *  – Flatten attachments
 *  – Map _count.replies → replyCount
 */
const formatMessage = (raw: any, viewerId: string) => {
  // Aggregate reactions
  const reactionMap = new Map<string, { count: number; reacted: boolean }>();
  for (const r of raw.reactions ?? []) {
    const existing = reactionMap.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === viewerId) existing.reacted = true;
    } else {
      reactionMap.set(r.emoji, { count: 1, reacted: r.userId === viewerId });
    }
  }

  const reactions = [...reactionMap.entries()].map(([emoji, data]) => ({
    emoji,
    count: data.count,
    reacted: data.reacted,
  }));

  // Flatten attachments (directly mapped in single-table schema)
  const attachments = raw.attachments ?? [];

  return {
    id: raw.id,
    channelId: raw.channelId,
    sender: raw.sender,
    content: raw.content,
    messageType: raw.messageType,
    parentMessageId: raw.parentMessageId ?? null,
    parentMessage: raw.parentMessage ? {
      id: raw.parentMessage.id,
      content: raw.parentMessage.content,
      sender: raw.parentMessage.sender,
      attachments: raw.parentMessage.attachments ?? [],
    } : null,
    attachments,
    reactions,
    replyCount: raw._count?.replies ?? 0,
    isEdited: raw.isEdited,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * 2.1 — List messages for a channel with cursor-based pagination.
 */
export const listMessages = async (
  channelId: string,
  userId: string,
  cursor?: string,
  limit: number = 30,
) => {
  await assertChannelAccess(channelId, userId);

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      deletedAt: null,
    },
    include: messageInclude(userId),
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to determine nextCursor
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor itself
        }
      : {}),
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return {
    messages: items.map((m) => formatMessage(m, userId)),
    nextCursor,
  };
};

/**
 * 2.2 — Create a new message (or a reply when parentMessageId is provided).
 */
export const createMessage = async (
  channelId: string,
  senderId: string,
  dto: {
    content: string;
    parentMessageId?: string;
    attachmentIds?: string[];
  },
) => {
  if (!dto.content?.trim() && (!dto.attachmentIds || dto.attachmentIds.length === 0)) {
    throw Object.assign(
      new Error('Message must contain either text content or at least one attachment'),
      { status: 400 }
    );
  }

  const channel = await assertChannelAccess(channelId, senderId);

  // Determine message type
  const hasAttachments = dto.attachmentIds && dto.attachmentIds.length > 0;
  const messageType = hasAttachments ? (dto.content.trim() ? 'mixed' : 'file') : 'text';

  const message = await prisma.$transaction(async (tx) => {
    // 1. Create the message
    const created = await tx.message.create({
      data: {
        channelId,
        senderId,
        content: dto.content,
        messageType,
        parentMessageId: dto.parentMessageId ?? null,
      },
    });

    // 2. Link attachments
    if (hasAttachments) {
      await tx.attachment.updateMany({
        where: { id: { in: dto.attachmentIds! } },
        data: { message_id: created.id },
      });
    }

    // 3. Parse & store mentions
    let mentionedUserIds = parseMentions(dto.content);
    const isGroup = channel.type !== 'dm';
    const hasAtAll = /@all\b/i.test(dto.content);
    if (hasAtAll && isGroup) {
      const channelMembers = await tx.channelMember.findMany({
        where: { channel_id: channelId },
        select: { user_id: true },
      });
      const memberIds = channelMembers
        .map((m) => m.user_id)
        .filter((uid) => uid !== senderId);
      mentionedUserIds = Array.from(new Set([...mentionedUserIds, ...memberIds]));
    }

    if (mentionedUserIds.length > 0) {
      // Only mention users who actually exist
      const existingUsers = await tx.user.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true },
      });

      const validIds = existingUsers.map((u) => u.id);

      if (validIds.length > 0) {
        await tx.messageMention.createMany({
          data: validIds.map((uid) => ({
            messageId: created.id,
            mentionedUserId: uid,
          })),
        });
      }
    }

    // 4. Update channel's last_message_at
    await tx.channel.update({
      where: { id: channelId },
      data: { last_message_at: new Date() },
    });

    // 5. Re-fetch the full message with includes
    return tx.message.findUniqueOrThrow({
      where: { id: created.id },
      include: messageInclude(senderId),
    });
  });

  const formatted = formatMessage(message, senderId);

  // ── Socket & Notifications ──
  try {
    const io = getIO();
    io.to(`channel:${channelId}`).emit(MessageEvents.MESSAGE_RECEIVED, formatted);

    // Fetch active sockets in this channel to determine who is "in the chat"
    const activeSockets = await io.in(`channel:${channelId}`).fetchSockets();
    const activeUserIds = new Set(activeSockets.map((s) => s.handshake.auth?.userId).filter(Boolean));

    const isGroup = channel.type !== 'dm';
    const hasAtAll = /@all\b/i.test(dto.content);
    
    // Parse normal mentions
    let mentionedUserIds = parseMentions(dto.content);
    
    // If @all is used in a group channel, mention all members
    if (hasAtAll && isGroup) {
      const channelMembers = await prisma.channelMember.findMany({
        where: { channel_id: channelId },
        select: { user_id: true },
      });
      const memberIds = channelMembers
        .map((m) => m.user_id)
        .filter((uid) => uid !== senderId);
      mentionedUserIds = Array.from(new Set([...mentionedUserIds, ...memberIds]));
    }

    // ── Emit MENTION_CREATED to mentioned users NOT in the active chat ──
    const inactiveMentionedUserIds = mentionedUserIds.filter(
      (uid) => uid !== senderId && !activeUserIds.has(uid)
    );

    if (inactiveMentionedUserIds.length > 0) {
      const mentionPayload: MentionEvent = {
        messageId: formatted.id,
        channelId,
        mentionedUserIds: inactiveMentionedUserIds,
      };
      for (const uid of inactiveMentionedUserIds) {
        io.to(`user:${uid}`).emit(MessageEvents.MENTION_CREATED, mentionPayload);
      }
    }

    // ── Create Database Notifications for Mentions (for those NOT in the active chat) ──
    if (inactiveMentionedUserIds.length > 0) {
      const senderInfo = await prisma.user.findUnique({
        where: { id: senderId },
        select: { display_name: true },
      });

      for (const uid of inactiveMentionedUserIds) {
        createNotification(
          uid,
          'mention',
          'New Mention',
          `${senderInfo?.display_name ?? 'Someone'} mentioned you in #${channel.name}`,
          { messageId: formatted.id, channelId, workspaceId: channel.workspace_id },
        ).catch(() => {}); // non-blocking
      }
    }

    // ── Quiet notifications on new message if not in chat ──
    const channelMembers = await prisma.channelMember.findMany({
      where: { channel_id: channelId },
      select: { user_id: true },
    });

    const senderInfo = await prisma.user.findUnique({
      where: { id: senderId },
      select: { display_name: true },
    });

    const isDm = channel.type === 'dm';
    const notificationTitle = isDm ? 'New Message' : `New message in #${channel.name}`;
    const notificationBody = `${senderInfo?.display_name ?? 'Someone'}: ${formatted.content || 'sent an attachment'}`;

    for (const member of channelMembers) {
      const uid = member.user_id;
      if (uid === senderId) continue;
      if (activeUserIds.has(uid)) continue;
      // Skip if they already received a mention notification
      if (mentionedUserIds.includes(uid)) continue; 

      createNotification(
        uid,
        'message',
        notificationTitle,
        notificationBody,
        { workspaceId: channel.workspace_id, channelId },
      ).catch(() => {});
    }
  } catch (err) {
    console.error('Error in socket/notification dispatch:', err);
  }

  return formatted;
};

/**
 * 2.3 — Edit own message.
 */
export const updateMessage = async (
  messageId: string,
  userId: string,
  content: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.deletedAt) {
    throw Object.assign(new Error('Message not found'), { status: 404 });
  }

  if (message.senderId !== userId) {
    throw Object.assign(new Error('You can only edit your own messages'), { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    include: messageInclude(userId),
  });

  const formatted = formatMessage(updated, userId);

  // ── Socket: broadcast edit ──
  try {
    const io = getIO();
    io.to(`channel:${message.channelId}`).emit(MessageEvents.MESSAGE_UPDATED, formatted);
  } catch {
    console.warn('Socket.io not available, skipping real-time push');
  }

  return formatted;
};

/**
 * 2.4 — Soft-delete a message (sender or workspace admin).
 */
export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });

  if (!message || message.deletedAt) {
    throw Object.assign(new Error('Message not found'), { status: 404 });
  }

  // Allow sender or workspace admin/owner
  if (message.senderId !== userId) {
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspace_id: message.channel.workspace_id,
        user_id: userId,
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!member) {
      throw Object.assign(new Error('You can only delete your own messages'), { status: 403 });
    }
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  // ── Socket: broadcast deletion ──
  try {
    const io = getIO();
    io.to(`channel:${message.channelId}`).emit(MessageEvents.MESSAGE_DELETED, {
      messageId,
      channelId: message.channelId,
    });
  } catch {
    console.warn('Socket.io not available, skipping real-time push');
  }
};

/**
 * 2.5 — Add a reaction to a message.
 */
export const addReaction = async (
  messageId: string,
  userId: string,
  emoji: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.deletedAt) {
    throw Object.assign(new Error('Message not found'), { status: 404 });
  }

  // Upsert — the @@unique constraint prevents duplicates
  await prisma.messageReaction.upsert({
    where: {
      messageId_userId_emoji: { messageId, userId, emoji },
    },
    create: { messageId, userId, emoji },
    update: {}, // already exists, no-op
  });

  // ── Socket: broadcast reaction ──
  try {
    const io = getIO();
    io.to(`channel:${message.channelId}`).emit(MessageEvents.REACTION_ADDED, {
      messageId,
      emoji,
      userId,
    });
  } catch {
    console.warn('Socket.io not available, skipping real-time push');
  }
};

/**
 * 2.6 — Remove own reaction from a message.
 */
export const removeReaction = async (
  messageId: string,
  userId: string,
  emoji: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.deletedAt) {
    throw Object.assign(new Error('Message not found'), { status: 404 });
  }

  const deleted = await prisma.messageReaction.deleteMany({
    where: { messageId, userId, emoji },
  });

  if (deleted.count === 0) {
    throw Object.assign(new Error('Reaction not found'), { status: 404 });
  }

  // ── Socket: broadcast removal ──
  try {
    const io = getIO();
    io.to(`channel:${message.channelId}`).emit(MessageEvents.REACTION_REMOVED, {
      messageId,
      emoji,
      userId,
    });
  } catch {
    console.warn('Socket.io not available, skipping real-time push');
  }
};

/**
 * 2.7 — List replies (thread) for a parent message.
 */
export const listReplies = async (
  parentMessageId: string,
  userId: string,
  cursor?: string,
  limit: number = 30,
) => {
  // Verify parent exists and user has channel access
  const parent = await prisma.message.findUnique({
    where: { id: parentMessageId },
  });

  if (!parent || parent.deletedAt) {
    throw Object.assign(new Error('Parent message not found'), { status: 404 });
  }

  await assertChannelAccess(parent.channelId, userId);

  const replies = await prisma.message.findMany({
    where: {
      parentMessageId,
      deletedAt: null,
    },
    include: messageInclude(userId),
    orderBy: { createdAt: 'asc' }, // oldest first for threads
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = replies.length > limit;
  const items = hasMore ? replies.slice(0, limit) : replies;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return {
    messages: items.map((m) => formatMessage(m, userId)),
    nextCursor,
  };
};

/**
 * 2.8 — Create a reply (delegates to createMessage with parentMessageId).
 */
export const createReply = async (
  parentMessageId: string,
  senderId: string,
  dto: {
    content: string;
    attachmentIds?: string[];
  },
) => {
  const parent = await prisma.message.findUnique({
    where: { id: parentMessageId },
  });

  if (!parent || parent.deletedAt) {
    throw Object.assign(new Error('Parent message not found'), { status: 404 });
  }

  return createMessage(parent.channelId, senderId, {
    ...dto,
    parentMessageId,
  });
};
