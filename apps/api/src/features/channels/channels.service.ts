import { prisma } from '../../database/prisma';
import { createNotification } from '../notifications/notifications.service';

const channelMemberSelect = {
  user: {
    select: {
      id: true,
      email: true,
      display_name: true,
      avatar_url: true,
      status: true,
    },
  },
} as const;

type ChannelMemberWithUser = {
  user_id: string;
  user?: {
    display_name: string;
    email: string;
  };
};

const resolveDmName = (
  members: ChannelMemberWithUser[],
  viewerId: string,
  fallbackName: string,
) => {
  const peer = members.find((m) => m.user_id !== viewerId);
  if (!peer?.user) return fallbackName;
  return peer.user.display_name || peer.user.email;
};

const assertChannelAccess = async (channelId: string, workspaceId: string, userId: string) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.workspace_id !== workspaceId) {
    throw Object.assign(new Error('Channel not found'), { status: 404 });
  }

  if (channel.type === 'public') {
    return channel;
  }

  if (channel.created_by_id === userId) {
    return channel;
  }

  const membership = await prisma.channelMember.findUnique({
    where: { channel_id_user_id: { channel_id: channelId, user_id: userId } },
  });

  if (!membership) {
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  return channel;
};

export const listChannels = async (workspaceId: string, userId: string) => {
  const channels = await prisma.channel.findMany({
    where: {
      workspace_id: workspaceId,
      OR: [
        { type: 'public' },
        { created_by_id: userId },
        { members: { some: { user_id: userId } } },
      ],
    },
    include: {
      members: {
        include: channelMemberSelect,
      },
    },
    orderBy: { created_at: 'asc' },
  });

  return channels.map((channel) => {
    const { members, ...channelData } = channel;
    const viewerIsMember =
      channel.created_by_id === userId || members.some((m) => m.user_id === userId);
    const name =
      channel.type === 'dm' ? resolveDmName(members, userId, channel.name) : channel.name;

    return {
      ...channelData,
      name,
      viewer_is_member: viewerIsMember,
      viewer_can_join: channel.type === 'public' && !viewerIsMember,
    };
  });
};

export const createChannel = async (
  actorId: string,
  workspaceId: string,
  dto: { name: string; type?: 'public' | 'private' | 'dm'; participantUserId?: string },
) => {
  // Only owner/admin can create channels
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor || !['owner', 'admin'].includes(actor.role) && dto.type !== 'dm') {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  if (dto.type === 'dm') {
    if (!dto.participantUserId) {
      throw Object.assign(new Error('A DM channel requires one selected person'), { status: 400 });
    }
    if (dto.participantUserId === actorId) {
      throw Object.assign(new Error('Select another user for a DM channel'), { status: 400 });
    }

    // Check if DM already exists
    const existingDm = await prisma.channel.findFirst({
      where: {
        workspace_id: workspaceId,
        type: 'dm',
        AND: [
          { members: { some: { user_id: actorId } } },
          { members: { some: { user_id: dto.participantUserId } } },
        ],
      },
    });

    if (existingDm) {
      const members = await prisma.channelMember.findMany({
        where: { channel_id: existingDm.id },
        include: channelMemberSelect,
      });
      return {
        ...existingDm,
        name: resolveDmName(members, actorId, existingDm.name),
      };
    }
  }

  const channel = await prisma.$transaction(async (tx) => {
    const created = await tx.channel.create({
      data: {
        workspace_id: workspaceId,
        name: dto.name,
        type: dto.type ?? 'public',
        created_by_id: actorId,
      },
    });

    await tx.channelMember.create({
      data: {
        channel_id: created.id,
        user_id: actorId,
      },
    });

    if (created.type === 'dm' && dto.participantUserId) {

      const participant = await tx.user.findUnique({
        where: { id: dto.participantUserId },
      });

      if (!participant) {
        throw Object.assign(new Error('Selected user was not found'), { status: 404 });
      }

      await tx.channelMember.create({
        data: {
          channel_id: created.id,
          user_id: dto.participantUserId,
        },
      });
    }

    return created;
  });

  if (channel.type === 'dm') {
    const members = await prisma.channelMember.findMany({
      where: { channel_id: channel.id },
      include: channelMemberSelect,
    });
    return {
      ...channel,
      name: resolveDmName(members, actorId, channel.name),
    };
  }

  return channel;
};

export const getChannel = async (workspaceId: string, channelId: string, userId: string) => {
  const channel = await assertChannelAccess(channelId, workspaceId, userId);

  if (channel.type !== 'dm') {
    return channel;
  }

  const members = await prisma.channelMember.findMany({
    where: { channel_id: channelId },
    include: channelMemberSelect,
  });

  return {
    ...channel,
    name: resolveDmName(members, userId, channel.name),
  };
};

export const listChannelMembers = async (workspaceId: string, channelId: string, userId: string) => {
  await assertChannelAccess(channelId, workspaceId, userId);

  const members = await prisma.channelMember.findMany({
    where: { channel_id: channelId },
    include: channelMemberSelect,
    orderBy: { joined_at: 'asc' },
  });

  return members.map((member) => ({
    user: member.user,
    joined_at: member.joined_at,
  }));
};

export const addChannelMember = async (
  actorId: string,
  workspaceId: string,
  channelId: string,
  userId: string,
) => {
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.workspace_id !== workspaceId) {
    throw Object.assign(new Error('Channel not found'), { status: 404 });
  }

  const workspaceMembership = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });
  if (!workspaceMembership) {
    throw Object.assign(new Error('User is not a workspace member'), { status: 404 });
  }

  if (actorId === userId) {
    if (channel.type !== 'public') {
      throw Object.assign(new Error('Only public channels can be joined directly'), { status: 403 });
    }
  } else if (!['owner', 'admin'].includes(actor.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const existing = await prisma.channelMember.findUnique({
    where: { channel_id_user_id: { channel_id: channelId, user_id: userId } },
  });
  if (existing) {
    throw Object.assign(new Error('User already in channel'), { status: 409 });
  }

  await prisma.channelMember.create({
    data: {
      channel_id: channelId,
      user_id: userId,
    },
  });

  // Send notification only when someone else adds you (not self-join)
  if (actorId !== userId) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { display_name: true },
    });

    await createNotification(
      userId,
      'channel_invite',
      'Channel Invitation',
      `${actor?.display_name ?? 'Someone'} added you to #${channel.name}`,
      { channelId, workspaceId },
    );
  }

  return channel;
};

export const joinPublicChannel = async (actorId: string, workspaceId: string, channelId: string) => {
  return addChannelMember(actorId, workspaceId, channelId, actorId);
};

export const updateChannel = async (
  actorId: string,
  workspaceId: string,
  channelId: string,
  dto: { name?: string },
) => {
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const channel = await prisma.channel.update({ where: { id: channelId }, data: dto });
  return channel;
};

export const deleteChannel = async (actorId: string, workspaceId: string, channelId: string) => {
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.workspace_id !== workspaceId) {
    throw Object.assign(new Error('Channel not found'), { status: 404 });
  }

  await prisma.channel.delete({ where: { id: channelId } });
};
