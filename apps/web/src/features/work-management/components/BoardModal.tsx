import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { X } from 'lucide-react';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
  isLoading?: boolean;
  initialData?: { name: string; description?: string };
  title: string;
}

export const BoardModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  initialData, 
  title 
}: BoardModalProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }
    onSave({ name, description });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl p-6 animate-zoom-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            onClick={onClose}
            icon={<X className="w-5 h-5" />}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Board Name"
            placeholder="e.g. Project Roadmap"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary ml-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full bg-surface-secondary border border-white/5 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[100px] transition-all resize-none"
              placeholder="What is this board for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isLoading}
            >
              {initialData ? 'Update Board' : 'Create Board'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
