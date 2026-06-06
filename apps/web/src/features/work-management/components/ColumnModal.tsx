import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { X } from 'lucide-react';
import type { BoardColumnDTO } from '@teamhub/shared';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
  onDelete?: () => void;
  isLoading?: boolean;
  initialData?: BoardColumnDTO;
  title: string;
}

export const ColumnModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  isLoading,
  initialData,
  title,
}: ColumnModalProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Column name is required');
      return;
    }
    onSave({ name });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl p-6 animate-zoom-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <Button variant="ghost" iconOnly size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Column Name"
            placeholder="e.g. In Progress"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            disabled={isLoading}
          />

          <div className="flex gap-3">
            {initialData && onDelete && (
              <Button
                type="button"
                variant="danger"
                className="flex-1 rounded-xl"
                onClick={onDelete}
                disabled={isLoading}
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className="flex-[2] rounded-xl"
              isLoading={isLoading}
            >
              {initialData ? 'Update Column' : 'Create Column'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
