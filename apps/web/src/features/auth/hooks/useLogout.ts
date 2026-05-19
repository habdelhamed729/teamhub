import { useAuthStore } from '@/app/store/useAuthStore';
import { logout as logoutApi } from '../api/auth.api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useLogout = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.logout);

  const logout = async () => {
    try {
      await logoutApi();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      clearAuth();
      toast.error('Session ended');
      navigate('/login');
    }
  };

  return { logout };
};
