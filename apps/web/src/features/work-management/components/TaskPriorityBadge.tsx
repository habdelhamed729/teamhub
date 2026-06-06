import type { TaskPriority } from '@teamhub/shared';

export const TaskPriorityBadge = ({ priority }: { priority: TaskPriority }) => {
  const styles = {
    urgent: 'text-danger bg-danger/10 border-danger/20',
    high: 'text-warning bg-warning/10 border-warning/20',
    medium: 'text-text-secondary bg-white/5 border-white/10',
    low: 'text-text-muted bg-white/5 border-white/5',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[priority]}`}>
      {priority}
    </span>
  );
};
