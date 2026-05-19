import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth.api';
import { useAuthStore } from '@/app/store/useAuthStore';
import { toast } from 'sonner';


export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,

    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      setAuth(data.user);
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    },

  });
};
