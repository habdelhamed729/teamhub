import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@teamhub/shared';
import type { RegisterRequest } from '@teamhub/shared';
import { useRegister } from '../hooks/useRegister';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export const RegisterForm = () => {
  const { mutate: registerUser, isPending, error } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<RegisterRequest> = (data) => {
    registerUser(data);
  };

  type ApiError = { response?: { data?: { message?: string } } };
  const errorMessage = (error as unknown as ApiError)?.response?.data?.message || null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <Controller
        name="display_name"
        control={control}
        render={({ field }) => (
          <Input
            label="Display Name"
            type="text"
            placeholder="Mazen Raafat"
            value={field.value}
            onChange={field.onChange}
            name={field.name}
            error={errors.display_name?.message}
            variant={errors.display_name ? 'error' : 'default'}
            className="bg-main-bg"
          />
        )}
      />

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

      <Button type="submit" className="w-full mt-4 py-3 h-12 text-lg" isLoading={isPending}>
        Create Account
      </Button>
    </form>
  );
};
