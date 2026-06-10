import { prisma } from '../../database/prisma';
import { NotFoundError } from '../work-management/work-management.errors';
import { mapTaskToDTO } from '../work-management/work-management.mapper';

/**
 * Verifies that a workspace exists and that the user is an active member.
 * Returns core workspace details.
 */
export const verifyWorkspaceAccess = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: userId
      }
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: { members: true }
          }
        }
      }
    }
  });

  if (!membership) {
    throw new NotFoundError('Workspace not found or access denied');
  }

  const workspace = membership.workspace;

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    logo_url: workspace.logo_url,
    plan: workspace.plan,
    memberCount: workspace._count.members
  };
};

/**
 * Fetches user-specific task stats (todo, in progress, overdue, active priority list, and workload points).
 */
export const fetchUserTaskStats = async (workspaceId: string, userId: string) => {
  const assignedTasks = await prisma.task.findMany({
    where: {
      board: { workspaceId },
      assignees: { some: { userId } }
    },
    include: {
      column: true,
      board: true,
      assignees: {
        include: { user: true }
      }
    }
  });

  const now = new Date();
  const todayStr = now.toDateString();

  let todoCount = 0;
  let inProgressCount = 0;
  let overdueCount = 0;
  let currentPoints = 0;

  const priorityPoints: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 5
  };

  const activeTasks: typeof assignedTasks = [];

  for (const task of assignedTasks) {
    const colName = task.column.name.toLowerCase();
    const isCompleted = colName === 'done' || colName === 'completed' || colName === 'archive' || colName === 'archived';

    if (!isCompleted) {
      activeTasks.push(task);
      currentPoints += priorityPoints[task.priority] || 2;

      const isOverdue = task.dueDate && 
                        new Date(task.dueDate) < now && 
                        new Date(task.dueDate).toDateString() !== todayStr;

      if (isOverdue) {
        overdueCount++;
      } else if (colName === 'in progress' || colName === 'doing' || colName === 'in dev') {
        inProgressCount++;
      } else {
        todoCount++;
      }
    }
  }

  // Sort active tasks to show top active priority tasks (Urgent/High first, then soonest due dates)
  const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 2;
    const pB = priorityOrder[b.priority] || 2;
    if (pA !== pB) return pB - pA;

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.dueDate ? -1 : (b.dueDate ? 1 : 0);
  });

  const activePriorityTasks = sortedActiveTasks.slice(0, 5).map(mapTaskToDTO);

  return {
    taskStats: {
      todo: todoCount,
      inProgress: inProgressCount,
      overdue: overdueCount,
      totalActive: activeTasks.length
    },
    workload: {
      currentPoints,
      capacityLimit: 10
    },
    activePriorityTasks
  };
};

/**
 * Fetches the top 5 recently updated documents.
 */
export const fetchRecentDocuments = async (workspaceId: string) => {
  return prisma.document.findMany({
    where: {
      workspace_id: workspaceId,
      is_archived: false
    },
    orderBy: {
      updated_at: 'desc'
    },
    take: 5,
    include: {
      last_editor: {
        select: { id: true, display_name: true, avatar_url: true }
      },
      creator: {
        select: { id: true, display_name: true, avatar_url: true }
      }
    }
  });
};

/**
 * Fetches all members in a workspace and maps them to WorkspaceMember structure.
 */
export const fetchWorkspaceMembers = async (workspaceId: string) => {
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspaceId },
    include: {
      user: {
        select: {
          id: true,
          display_name: true,
          email: true,
          avatar_url: true,
          status: true
        }
      }
    },
    orderBy: { joined_at: 'asc' }
  });

  return workspaceMembers.map(m => ({
    workspace_id: m.workspace_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    user: m.user
  }));
};

/**
 * Fetches, normalizes, and merges tasks, documents, and comments into a unified activity feed.
 */
export const fetchRecentActivities = async (workspaceId: string) => {
  const [recentTasks, recentDocs, recentComments] = await Promise.all([
    prisma.task.findMany({
      where: { board: { workspaceId } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { id: true, display_name: true, avatar_url: true } },
        board: { select: { id: true, name: true } }
      }
    }),
    prisma.document.findMany({
      where: { workspace_id: workspaceId, is_archived: false },
      orderBy: { updated_at: 'desc' },
      take: 10,
      include: {
        last_editor: { select: { id: true, display_name: true, avatar_url: true } },
        creator: { select: { id: true, display_name: true, avatar_url: true } }
      }
    }),
    prisma.taskComment.findMany({
      where: { task: { board: { workspaceId } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        author: { select: { id: true, display_name: true, avatar_url: true } },
        task: { select: { id: true, title: true } }
      }
    })
  ]);

  const taskActivities = recentTasks.map(t => ({
    id: `task-${t.id}-${t.updatedAt.getTime()}`,
    type: t.createdAt.getTime() === t.updatedAt.getTime() ? 'task_created' : 'task_updated',
    user: {
      id: t.creatorId,
      display_name: t.creator.display_name,
      avatar_url: t.creator.avatar_url
    },
    targetName: t.title,
    targetId: t.id,
    timestamp: t.updatedAt.toISOString(),
    metadata: { boardName: t.board.name, boardId: t.board.id }
  }));

  const docActivities = recentDocs.map(d => ({
    id: `doc-${d.id}-${d.updated_at.getTime()}`,
    type: d.created_at.getTime() === d.updated_at.getTime() ? 'document_created' : 'document_updated',
    user: {
      id: d.last_edited_by_id || d.created_by_id,
      display_name: d.last_editor?.display_name || d.creator.display_name,
      avatar_url: d.last_editor?.avatar_url || d.creator.avatar_url
    },
    targetName: d.title,
    targetId: d.id,
    timestamp: d.updated_at.toISOString()
  }));

  const commentActivities = recentComments.map(c => ({
    id: `comment-${c.id}-${c.createdAt.getTime()}`,
    type: 'comment_created',
    user: {
      id: c.authorId,
      display_name: c.author.display_name,
      avatar_url: c.author.avatar_url
    },
    targetName: c.task.title,
    targetId: c.task.id,
    timestamp: c.createdAt.toISOString(),
    metadata: { content: c.content }
  }));

  return [...taskActivities, ...docActivities, ...commentActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
};

/**
 * Orchestrates the concurrent fetching of all sub-widget data blocks.
 */
export const getDashboardData = async (workspaceId: string, userId: string) => {
  const workspace = await verifyWorkspaceAccess(workspaceId, userId);

  const [taskData, recentDocuments, members, activities] = await Promise.all([
    fetchUserTaskStats(workspaceId, userId),
    fetchRecentDocuments(workspaceId),
    fetchWorkspaceMembers(workspaceId),
    fetchRecentActivities(workspaceId)
  ]);

  return {
    workspace,
    taskStats: taskData.taskStats,
    workload: taskData.workload,
    activePriorityTasks: taskData.activePriorityTasks,
    recentDocuments,
    members,
    activities
  };
};
