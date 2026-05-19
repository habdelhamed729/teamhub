import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth.api';
import { toast } from 'sonner';


export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,

    onSuccess: () => {
      toast.success('Account created! Please sign in to continue.');
      navigate('/login');
    },

  });
};
