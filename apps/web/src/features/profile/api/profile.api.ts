import { api } from '@/shared/services/axios';
import type { User } from '@teamhub/shared';

export interface UpdateUserRequest {
  display_name?: string;
  avatar_url?: string;
}

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/users/me');
  return data.data.user;
};

export const updateMe = async (req: UpdateUserRequest): Promise<User> => {
  const { data } = await api.patch('/users/me', req);
  return data.data.user;
};
