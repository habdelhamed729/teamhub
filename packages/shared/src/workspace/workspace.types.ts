import type { User } from '../auth';

export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type Plan = 'free' | 'pro';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  owner_id: string;
  plan: Plan;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string | Date;
  user: User;
  workspace?: Workspace;
}
