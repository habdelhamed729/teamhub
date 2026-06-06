import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { X, User as UserIcon } from 'lucide-react';
import type { TaskDTO, TaskPriority } from '@teamhub/shared';
import { useMembers } from '@/features/members/hooks/useMembers';

interface TaskCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string | null;
    assigneeIds: string[];
  }) => void;
  isLoading?: boolean;
  initialData?: TaskDTO;
  workspaceId: string;
  title: string;
}

export const TaskCreateEditModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
  workspaceId,
  title,
}: TaskCreateEditModalProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: (initialData?.priority || 'medium') as TaskPriority,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    assigneeIds: initialData?.assignees.map(a => a.userId) || [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: members } = useMembers(workspaceId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    });
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...prev.assigneeIds, userId]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-elevated/50">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <Button variant="ghost" iconOnly size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
        </div>

        {/* Body */}
        <form id="task-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <Input
            label="Task Title"
            placeholder="What needs to be done?"
            value={formData.title}
            onChange={e => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary ml-1">Description</label>
            <textarea
              className="w-full bg-surface-secondary border border-white/5 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[120px] transition-all resize-none"
              placeholder="Add more details..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary ml-1">Priority</label>
              <select
                className="w-full bg-surface-secondary border border-white/5 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all cursor-pointer"
                value={formData.priority}
                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary ml-1">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-surface-secondary border border-white/5 rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all cursor-pointer"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-text-secondary ml-1 flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5" />
              Assignees
            </label>
            <div className="flex flex-wrap gap-2">
              {members?.map(member => (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => toggleAssignee(member.user_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    formData.assigneeIds.includes(member.user_id)
                      ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent'
                      : 'bg-surface-secondary border-white/5 text-text-muted hover:border-white/10'
                  }`}
                >
                  <div className="w-5 h-5 rounded bg-surface-elevated flex items-center justify-center text-[10px] font-bold">
                    {member.user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium">{member.user.display_name}</span>
                </button>
              ))}
              {!members?.length && <p className="text-xs text-text-muted italic">No workspace members found</p>}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-surface-elevated/50 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" variant="primary" className="flex-1 rounded-xl" isLoading={isLoading}>
            {initialData ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
};
