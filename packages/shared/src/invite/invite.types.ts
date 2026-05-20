export interface Invite {
  id: string;
  code: string;
  workspace_id: string;
  created_by_id: string;
  expires_at?: string | Date | null;
  max_uses?: number | null;
  uses: number;
  created_at: string | Date;
}
