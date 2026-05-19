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
      setAuth(data.user, data.access_token);
      toast.success('Account created successfully!');
      navigate('/login');
    },

  });
};
