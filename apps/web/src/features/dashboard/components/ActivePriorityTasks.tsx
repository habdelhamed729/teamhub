import { CheckSquare, Calendar, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ActivePriorityTasksProps {
  workspaceId: string;
  activePriorityTasks: any[];
}

export const ActivePriorityTasks = ({
  workspaceId,
  activePriorityTasks,
}: ActivePriorityTasksProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Active Priority</h2>
          <p className="text-xs text-text-muted mt-0.5">Your top high-priority tasks</p>
        </div>
        <Link to={`/workspaces/${workspaceId}/tasks`} className="text-xs font-bold text-primary-accent hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3.5">
        {activePriorityTasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => navigate(`/workspaces/${workspaceId}/tasks/${task.boardId}?task=${task.id}`)}
            className="flex items-center justify-between gap-4 bg-surface-secondary/30 hover:bg-surface-secondary/70 border border-white/5 hover:border-primary-accent/20 px-4 py-3.5 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <CheckSquare className="w-4.5 h-4.5 text-text-muted shrink-0 group-hover:text-primary-accent transition-colors" />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-text-primary truncate">{task.title}</h4>
                <p className="text-[11px] text-text-muted font-medium mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase text-[9px] font-bold">
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex -space-x-2.5 overflow-hidden shrink-0">
              {task.assignees.map((assignee: any) => (
                <div 
                  key={assignee.userId} 
                  className="w-6 h-6 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden font-bold text-[9px] text-text-primary ring-2 ring-surface-secondary"
                  title={assignee.user.display_name}
                >
                  {assignee.user.avatar_url ? (
                    <img src={assignee.user.avatar_url} alt={assignee.user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    assignee.user.display_name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {activePriorityTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl p-6 bg-surface-secondary/10 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-white/5 flex items-center justify-center mb-3">
              <CheckSquare className="w-5 h-5 text-text-muted opacity-40" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">All caught up!</h4>
            <p className="text-[11px] text-text-muted max-w-xs mt-1">No active priority tasks assigned to you. Take a break or auto-assign new tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
};
