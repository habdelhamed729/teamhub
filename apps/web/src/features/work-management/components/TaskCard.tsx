import type { TaskDTO } from '@teamhub/shared';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskDueDate } from './TaskDueDate';
import { TaskAssigneeAvatar } from './TaskAssigneeAvatar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: TaskDTO;
  onClick: (taskId: string) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
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
        className="bg-surface-elevated/30 border-2 border-dashed border-primary-accent/20 rounded-xl h-[120px] mb-3"
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
      className="bg-surface-elevated border border-white/5 rounded-xl p-4 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:border-primary-accent/30 hover:shadow-premium transition-all active:scale-[0.99] group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-primary-accent transition-colors">
          {task.title}
        </h4>
      </div>

      {task.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <TaskPriorityBadge priority={task.priority} />
          <TaskDueDate date={task.dueDate} />
        </div>

        <div className="flex -space-x-1.5 overflow-hidden">
          {task.assignees.slice(0, 3).map((assignee) => (
            <TaskAssigneeAvatar key={assignee.userId} assignee={assignee} />
          ))}
          {task.assignees.length > 3 && (
            <div className="w-6 h-6 rounded-lg bg-surface-secondary border border-white/10 flex items-center justify-center text-[8px] font-bold text-text-muted">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
