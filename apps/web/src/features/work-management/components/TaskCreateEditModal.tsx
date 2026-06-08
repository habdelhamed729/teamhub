import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { X, User as UserIcon } from 'lucide-react';
import type { TaskDTO, TaskPriority } from '@teamhub/shared';
import { useMembers } from '@/features/members/hooks/useMembers';
import type { TaskFormValues } from '../utils/workManagementPayloads';

import { WorkSelect, type WorkSelectOption } from './WorkSelect';

export interface TaskCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormValues) => void;
  isLoading: boolean;
  initialData?: TaskDTO;
  workspaceId: string;
  title: string;
}

const priorityOptions: WorkSelectOption<TaskPriority>[] = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' },
];

export const TaskCreateEditModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
  workspaceId,
  title,
}: TaskCreateEditModalProps) => {
  const [formData, setFormData] = useState<TaskFormValues>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: (initialData?.priority || 'medium') as TaskPriority,
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : null,
    assigneeIds: initialData?.assignees.map(a => a.userId) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: members, isLoading: isLoadingMembers } = useMembers(workspaceId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    const sanitizedTitle = formData.title.trim();
    if (!sanitizedTitle) {
      newErrors.title = 'Title is required';
    } else if (sanitizedTitle.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top to see error
      const form = document.getElementById('task-form');
      form?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Filter out any potential invalid IDs and ensure it's not [null]
    const validAssigneeIds = (formData.assigneeIds || []).filter(
      id => typeof id === 'string' && id.trim().length > 0
    );

    // Convert local date string back to ISO for API, or keep null
    const finalData: TaskFormValues = {
      ...formData,
      title: sanitizedTitle,
      assigneeIds: validAssigneeIds,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    };

    onSave(finalData);
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
      <div className="relative w-full max-w-xl bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh] ring-1 ring-white/5">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-surface-elevated/50">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            <p className="text-xs text-text-muted mt-0.5">Fill in the details for your task</p>
          </div>
          <Button variant="ghost" iconOnly size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
        </div>

        {/* Body */}
        <form id="task-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 scrollbar-thin">
          <Input
            label="Task Title"
            placeholder="e.g. Design system audit"
            value={formData.title}
            onChange={e => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            disabled={isLoading}
            autoFocus
          />

          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-text-secondary ml-1">Description</label>
            <textarea
              className="w-full bg-surface-secondary border border-white/5 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[140px] transition-all resize-none scrollbar-thin"
              placeholder="Add more context, links, or details..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-text-secondary ml-1">Priority</label>
              <WorkSelect<TaskPriority>
                value={formData.priority}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, priority: val }));
                }}
                options={priorityOptions}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-text-secondary ml-1">Due Date</label>
              <input
                type="date"
                className="w-full bg-surface-secondary border border-white/5 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all cursor-pointer [color-scheme:dark]"
                value={formData.dueDate || ''}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value || null }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Assignees
              </label>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                {formData.assigneeIds.length} Selected
              </span>
            </div>
            
            <div className="bg-surface-secondary/50 border border-white/5 rounded-xl p-3 max-h-[160px] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isLoadingMembers ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
                  ))
                ) : members?.map(member => {
                  const isSelected = formData.assigneeIds.includes(member.user_id);
                  return (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => toggleAssignee(member.user_id)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left group ${
                        isSelected
                          ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent shadow-[0_0_15px_-5px_rgba(94,234,212,0.2)]'
                          : 'bg-surface-elevated border-white/5 text-text-muted hover:border-white/10 hover:bg-surface-elevated/80'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isSelected ? 'bg-primary-accent text-main-bg' : 'bg-surface-secondary text-text-muted group-hover:bg-surface-secondary/80'
                      }`}>
                        {member.user.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate">{member.user.display_name}</span>
                    </button>
                  );
                })}
                {!isLoadingMembers && !members?.length && (
                  <p className="text-xs text-text-muted italic col-span-2 text-center py-4">
                    No workspace members found
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-surface-elevated/50 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-xl h-11" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="task-form" 
            variant="primary" 
            className="flex-1 rounded-xl h-11" 
            isLoading={isLoading}
          >
            {initialData ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
};
