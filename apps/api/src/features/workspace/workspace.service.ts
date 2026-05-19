import { prisma } from '../../database/prisma';

// ─── create ─────────────────────────────────────────────────────────────────

export const createWorkspace = async (
  userId: string,
  dto: { name: string; slug: string },
) => {
  const slugTaken = await prisma.workspace.findUnique({ where: { slug: dto.slug } });
  if (slugTaken) throw Object.assign(new Error('Slug already taken'), { status: 409 });

  const workspace = await prisma.workspace.create({
    data: {
      name: dto.name,
      slug: dto.slug,
      owner_id: userId,
      members: {
        create: { user_id: userId, role: 'owner' },
      },
    },
  });

  return workspace;
};

// ─── list ────────────────────────────────────────────────────────────────────

export const listWorkspaces = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { user_id: userId },
    include: { workspace: true },
    orderBy: { joined_at: 'asc' },
  });

  return memberships.map((m) => m.workspace);
};

// ─── get one ─────────────────────────────────────────────────────────────────


export const getWorkspace = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    include: { workspace: true },
  });

  if (!membership) throw Object.assign(new Error('Workspace not found or access denied'), { status: 403 });

  return membership.workspace;
};

// ─── update ──────────────────────────────────────────────────────────────────

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  dto: { name?: string; slug?: string },
) => {
  // Only owner or admin may update
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
  });

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw Object.assign(new Error('Insufficient permissions'), { status: 403 });
  }

  if (dto.slug) {
    const slugTaken = await prisma.workspace.findFirst({
      where: { slug: dto.slug, id: { not: workspaceId } },
    });
    if (slugTaken) throw Object.assign(new Error('Slug already taken'), { status: 409 });
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: dto,
  });

  return workspace;
};

// ─── delete ──────────────────────────────────────────────────────────────────

export const deleteWorkspace = async (workspaceId: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });
  if (workspace.owner_id !== userId) {
    throw Object.assign(new Error('Only the owner can delete the workspace'), { status: 403 });
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
};





