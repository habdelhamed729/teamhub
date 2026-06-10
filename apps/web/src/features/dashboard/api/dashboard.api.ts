import { api } from '@/shared/services/axios';
import type { TaskDTO, Document } from '@teamhub/shared';

export interface DashboardWorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  plan: 'free' | 'pro';
  memberCount: number;
}

export interface DashboardTaskStatsDTO {
  todo: number;
  inProgress: number;
  overdue: number;
  totalActive: number;
}

export interface DashboardWorkloadDTO {
  currentPoints: number;
  capacityLimit: number;
}

export interface DashboardMemberDTO {
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string | null;
    status: 'online' | 'offline' | 'away' | 'dnd';
  };
}

export interface DashboardActivityDTO {
  id: string;
  type: 'task_created' | 'task_updated' | 'document_created' | 'document_updated' | 'comment_created';
  user: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
  targetName: string;
  targetId: string;
  timestamp: string;
  metadata?: {
    boardName?: string;
    boardId?: string;
    content?: string;
  };
}

export interface DashboardDataDTO {
  workspace: DashboardWorkspaceDTO;
  taskStats: DashboardTaskStatsDTO;
  workload: DashboardWorkloadDTO;
  activePriorityTasks: TaskDTO[];
  recentDocuments: (Document & {
    last_editor?: { id: string; display_name: string; avatar_url?: string | null } | null;
    creator: { id: string; display_name: string; avatar_url?: string | null };
  })[];
  members: DashboardMemberDTO[];
  activities: DashboardActivityDTO[];
}

export const getDashboardData = async (workspaceId: string): Promise<DashboardDataDTO> => {
  const { data } = await api.get(`/workspaces/${workspaceId}/dashboard`);
  return data.data;
};
