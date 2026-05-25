export interface Document {
  id: string;
  workspace_id: string;
  created_by_id: string;
  last_edited_by_id?: string | null;
  title: string;
  content: Record<string, unknown> | null;
  is_archived: boolean;
  archived_at?: string | Date | null;
  parent_id?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  creator?: { id: string; display_name: string; avatar_url?: string | null };
  last_editor?: { id: string; display_name: string; avatar_url?: string | null } | null;
  icon?: string | null;
  cover_url?: string | null;
}
