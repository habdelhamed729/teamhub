import type { TaskAssigneeDTO } from '@teamhub/shared';

export const TaskAssigneeAvatar = ({ assignee }: { assignee: TaskAssigneeDTO }) => {
  return (
    <div 
      className="w-6 h-6 rounded-lg bg-surface-secondary border border-white/10 flex items-center justify-center overflow-hidden"
      title={assignee.user.display_name}
    >
      {assignee.user.avatar_url ? (
        <img src={assignee.user.avatar_url} alt={assignee.user.display_name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-text-primary">
          {assignee.user.display_name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};
