import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@teamhub/shared';
import type { LoginRequest } from '@teamhub/shared';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export const LoginForm = () => {
  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginRequest> = (data) => {
    login(data);
  };

  const errorMessage = (error as any)?.response?.data?.message || null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={field.value}
            onChange={field.onChange}
            name={field.name}
            error={errors.email?.message}
            variant={errors.email ? 'error' : 'default'}
            className="bg-main-bg"
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={field.value}
            onChange={field.onChange}
            name={field.name}
            error={errors.password?.message}
            variant={errors.password ? 'error' : 'default'}
            className="bg-main-bg"
          />
        )}
      />

      {errorMessage && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm animate-in fade-in slide-in-from-top-1">
          {errorMessage}
        </div>
      )}

      <Button type="submit" className="w-full py-3 h-auto text-lg h-12" isLoading={isPending}>
        Sign In
      </Button>
    </form>
  );
};
