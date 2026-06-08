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
    <>
      {/* Backdrop for mobile/tablet */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[85] animate-fade-in lg:bg-black/20" 
        onClick={onClose} 
      />
      
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[450px] bg-surface-elevated border-l border-white/10 shadow-2xl z-[90] flex flex-col animate-slide-in-right ring-1 ring-white/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" iconOnly size="sm" onClick={onClose} icon={<X className="w-5 h-5" />} />
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Task Details</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              iconOnly
              size="sm"
              onClick={() => onEdit(task)}
              icon={<Edit2 className="w-4 h-4" />}
              className="text-text-muted hover:text-primary-accent hover:bg-primary-accent/5"
            />
            <Button
              variant="ghost"
              iconOnly
              size="sm"
              onClick={() => onDelete(task.id)}
              icon={<Trash2 className="w-4 h-4" />}
              className="text-text-muted hover:text-danger hover:bg-danger/5"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-thin">
          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight break-words">
              {task.title}
            </h1>
            {task.description ? (
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-text-muted italic">No description provided</p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-y border-white/5">
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Priority
              </span>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Due Date
              </span>
              {task.dueDate ? (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    new Date(task.dueDate) < new Date() && new Date(task.dueDate).toDateString() !== new Date().toDateString()
                      ? 'text-danger' 
                      : 'text-text-primary'
                  }`}>
                    {new Date(task.dueDate).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  {new Date(task.dueDate) < new Date() && new Date(task.dueDate).toDateString() !== new Date().toDateString() && (
                    <span className="px-1.5 py-0.5 rounded bg-danger/10 text-[10px] font-bold text-danger uppercase">
                      Overdue
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-text-muted italic">No due date</span>
              )}
            </div>

            <div className="space-y-3 col-span-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="w-3 h-3" /> Assignees
              </span>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((assignee) => (
                  <div 
                    key={assignee.userId} 
                    className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 hover:bg-white/10 transition-colors group"
                  >
                    <TaskAssigneeAvatar assignee={assignee} />
                    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                      {assignee.user.display_name}
                    </span>
                  </div>
                ))}
                {task.assignees.length === 0 && (
                  <div className="text-xs text-text-muted italic py-1">Unassigned</div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pb-8">
            <TaskComments taskId={task.id} />
          </div>
        </div>

        {/* Footer / Timestamps */}
        <div className="px-6 py-4 border-t border-white/5 bg-surface-elevated/50 text-[10px] text-text-muted flex justify-between uppercase tracking-widest font-bold">
          <div className="flex flex-col gap-1">
            <span className="opacity-60">Created</span>
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="opacity-60">Last Updated</span>
            <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </>
  );
};
