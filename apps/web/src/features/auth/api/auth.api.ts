import { api } from '@/shared/services/axios';

import type { User } from '@teamhub/shared';

export interface AuthResponse {
  user: User;
}

export const login = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data.data;
};

export const register = async (data: {
  email: string;
  password: string;
  display_name: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data.data;
};

export const refresh = async (): Promise<AuthResponse> => {
  const response = await api.post('/auth/refresh');
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};
