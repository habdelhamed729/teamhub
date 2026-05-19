import { useAuthStore } from '@/app/store/useAuthStore';
import { refresh } from '../api/auth.api';
import { useEffect, useState } from 'react';

export const useRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(true);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const performRefresh = async () => {
      try {
        const data = await refresh();
        setAuth(data.user);
      } catch (error) {
        logout();
      } finally {
        setIsRefreshing(false);
      }
    };

    performRefresh();
  }, [setAuth, logout]);

  return { isRefreshing };
};
