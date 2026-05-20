import { prisma } from '../../database/prisma';

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
        where: { user_id: userId },
        select: { user_id: true },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  return channels.map((channel) => {
    const viewerIsMember = channel.created_by_id === userId || channel.members.length > 0;

    return {
      ...channel,
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
  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
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

    if (created.type === 'dm') {
      if (!dto.participantUserId) {
        throw Object.assign(new Error('A DM channel requires one selected person'), { status: 400 });
      }

      if (dto.participantUserId === actorId) {
        throw Object.assign(new Error('Select another user for a DM channel'), { status: 400 });
      }

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

  return channel;
};

export const getChannel = async (workspaceId: string, channelId: string, userId: string) => {
  return assertChannelAccess(channelId, workspaceId, userId);
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
