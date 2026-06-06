import type { TaskDTO } from '@teamhub/shared';
import { Button } from '@/shared/components/Button';
import { X, Clock, Calendar, User as UserIcon, Trash2, Edit2 } from 'lucide-react';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskAssigneeAvatar } from './TaskAssigneeAvatar';
import { TaskComments } from './TaskComments';

interface TaskDetailPanelProps {
  task: TaskDTO;
  onClose: () => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailPanel = ({ task, onClose, onEdit, onDelete }: TaskDetailPanelProps) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-surface-elevated border-l border-white/10 shadow-2xl z-[90] flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-elevated/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" iconOnly size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Task Details</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            onClick={() => onEdit(task)}
            icon={<Edit2 className="w-4 h-4" />}
            className="text-text-muted hover:text-primary-accent"
          />
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            onClick={() => onDelete(task.id)}
            icon={<Trash2 className="w-4 h-4" />}
            className="text-text-muted hover:text-danger"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
        {/* Title & Description */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-text-primary leading-tight">{task.title}</h1>
          {task.description ? (
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-text-muted italic text-sm">No description provided</p>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Priority
            </span>
            <TaskPriorityBadge priority={task.priority} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Due Date
            </span>
            {task.dueDate ? (
              <span className="text-sm font-medium text-text-primary">
                {new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
            ) : (
              <span className="text-sm text-text-muted italic">No due date</span>
            )}
          </div>

          <div className="space-y-3 col-span-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <UserIcon className="w-3 h-3" /> Assignees
            </span>
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((assignee) => (
                <div key={assignee.userId} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-2 py-1.5">
                  <TaskAssigneeAvatar assignee={assignee} />
                  <span className="text-xs font-medium text-text-secondary">{assignee.user.display_name}</span>
                </div>
              ))}
              {task.assignees.length === 0 && <span className="text-xs text-text-muted italic">Unassigned</span>}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <TaskComments taskId={task.id} />
      </div>

      {/* Footer / Timestamps */}
      <div className="p-6 border-t border-white/5 bg-surface-elevated/50 text-[10px] text-text-muted flex justify-between uppercase tracking-widest font-bold">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
