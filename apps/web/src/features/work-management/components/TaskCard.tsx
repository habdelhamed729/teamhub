import type { TaskDTO } from '@teamhub/shared';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskAssigneeAvatar } from './TaskAssigneeAvatar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar } from 'lucide-react';

interface TaskCardProps {
  task: TaskDTO;
  onClick: (taskId: string) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && new Date(task.dueDate).toDateString() !== new Date().toDateString();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-surface-elevated/20 border-2 border-dashed border-primary-accent/30 rounded-2xl h-[130px] mb-4 scale-95 opacity-50 transition-all"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task.id)}
      className="bg-surface-elevated border border-white/5 rounded-2xl p-4 shadow-sm mb-4 cursor-grab active:cursor-grabbing hover:border-primary-accent/30 hover:shadow-premium transition-all active:scale-[0.98] group animate-fade-in ring-1 ring-transparent hover:ring-white/5"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h4 className="text-sm font-bold text-text-primary line-clamp-2 group-hover:text-primary-accent transition-colors leading-snug">
          {task.title}
        </h4>
      </div>

      {task.description && (
        <p className="text-[11px] text-text-secondary line-clamp-2 mb-4 leading-relaxed opacity-80">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2.5">
          <TaskPriorityBadge priority={task.priority} />
          {task.dueDate && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
              isOverdue 
                ? 'bg-danger/10 border-danger/20 text-danger' 
                : 'bg-white/5 border-white/5 text-text-muted'
            }`}>
              <Calendar className="w-2.5 h-2.5" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        <div className="flex -space-x-2 overflow-hidden">
          {task.assignees.slice(0, 3).map((assignee) => (
            <div key={assignee.userId} className="ring-2 ring-surface-elevated rounded-lg">
              <TaskAssigneeAvatar assignee={assignee} />
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="w-6 h-6 rounded-lg bg-surface-secondary border border-white/10 flex items-center justify-center text-[9px] font-bold text-text-muted ring-2 ring-surface-elevated">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
