import { api } from '@/shared/services/axios';

export const searchUsers = async (q: string) => {
  const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
  return data.data.users;
};
