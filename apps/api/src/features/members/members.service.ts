import {prisma} from '../../database/prisma';
import { createNotification } from '../notifications/notifications.service';

export const listMembers = async (workspaceId: string) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspaceId },
    include: { user: { select: { id: true, email: true, display_name: true, status: true } } },
    orderBy: { joined_at: 'asc' },
  });

  return members.map((m) => ({
    user: m.user,
    role: m.role,
    joined_at: m.joined_at,
  }));
};

export const addMember = async (
  actorId: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member',
) => {

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const exists = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });
  if (exists) throw Object.assign(new Error('User already a member'), { status: 409 });

  const created = await prisma.workspaceMember.create({
    data: { workspace_id: workspaceId, user_id: userId, role },
  });

  // Fetch workspace name and actor name for the notification message
  const [workspace, actor] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: actorId }, select: { display_name: true } }),
  ]);

  // Send notification to the invited user
  await createNotification(
    userId,
    'channel_invite',
    'Workspace Invitation',
    `${actor?.display_name ?? 'Someone'} added you to ${workspace?.name ?? 'a workspace'}`,
    { workspaceId },
  );

  return created;
};

export const updateMemberRole = async (
  actorId: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member',
) => {
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor || actor.role !== 'owner') {
    throw Object.assign(new Error('Only owner can change roles'), { status: 403 });
  }

  const target = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  const updated = await prisma.workspaceMember.update({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    data: { role },
  });

  return updated;
};

export const removeMember = async (actorId: string, workspaceId: string, userId: string) => {
  const actor = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: actorId } },
  });
  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  const target = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });
  if (!target) throw Object.assign(new Error('Member not found'), { status: 404 });

  if (target.role === 'owner') {
    throw Object.assign(new Error('Cannot remove owner; transfer ownership first'), { status: 403 });
  }

  await prisma.workspaceMember.delete({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });
};
