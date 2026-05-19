import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuthStore } from '@/app/store/useAuthStore';
import { toast } from 'sonner';


export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,

    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      setAuth(data.user);
      toast.success(`Welcome back, ${data.user.display_name}!`);
      navigate('/workspaces');
    },

  });
};
