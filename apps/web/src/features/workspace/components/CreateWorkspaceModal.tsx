import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkspaceSchema } from '@teamhub/shared';
import type { CreateWorkspaceRequest } from '../api/workspace.api';
import { useCreateWorkspace } from '../hooks/useWorkspaces';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { mutate: create, isPending, isSuccess, reset: resetMutation } = useCreateWorkspace();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateWorkspaceRequest>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [nameValue, setValue]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Workspace created successfully!');
      onClose();
      reset();
      resetMutation();
    }
  }, [isSuccess, onClose, reset, resetMutation]);



  const onSubmit = (data: CreateWorkspaceRequest) => {
    create(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-secondary border border-white/5 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 text-text-primary">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold">New Workspace</h2>
          <p className="text-text-secondary mt-1">Start a fresh project with your team.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                label="Workspace Name"
                placeholder="Acme Corp"
                value={field.value}
                onChange={field.onChange}
                error={errors.name?.message}
                variant={errors.name ? 'error' : 'default'}
              />
            )}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input
                label="Workspace Slug"
                placeholder="acme-corp"
                value={field.value}
                onChange={field.onChange}
                error={errors.slug?.message}
                variant={errors.slug ? 'error' : 'default'}
              />
            )}
          />

          <div className="p-4 rounded-xl bg-surface-elevated border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary-accent/10 border border-primary-accent/20">
              <span className="text-xs font-bold text-primary-accent">TIP</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Your workspace URL will be: <span className="text-primary-accent font-medium">teamhub.com/{watch('slug') || '...'}</span>
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="flex-1 py-3" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" className="flex-1 py-3" type="submit" isLoading={isPending}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
