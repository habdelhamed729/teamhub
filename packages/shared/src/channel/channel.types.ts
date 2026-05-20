import type { User } from '../auth';

export type ChannelType = 'public' | 'private' | 'dm';

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  type: ChannelType;
  created_by_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  last_message_at?: string | Date | null;
  viewer_is_member?: boolean;
  viewer_can_join?: boolean;
}

export interface ChannelMember {
  channel_id: string;
  user_id: string;
  joined_at: string | Date;
  user?: User;
}
