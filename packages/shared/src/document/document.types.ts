export interface Document {
  id: string;
  workspace_id: string;
  created_by_id: string;
  title: string;
  content: Record<string, unknown> | null; // Tiptap JSON
  is_archived: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  creator?: { id: string; display_name: string; avatar_url?: string | null };
}
