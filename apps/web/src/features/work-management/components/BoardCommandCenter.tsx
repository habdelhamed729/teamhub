import { AlertCircle, ListTodo, User, Calendar } from 'lucide-react';

interface BoardCommandCenterProps {
  stats: {
    total: number;
    myTasks: number;
    overdue: number;
    urgent: number;
    unassigned: number;
    dueThisWeek: number;
  } | null;
}

export const BoardCommandCenter = ({ stats }: BoardCommandCenterProps) => {
  if (!stats) return null;

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none w-full py-1">
      <div className="flex items-center gap-2 bg-surface-secondary/30 px-3 py-1.5 rounded-xl border border-white/5 shrink-0">
        <ListTodo className="w-3.5 h-3.5 text-primary-accent" />
        <span className="text-[11px] font-bold text-text-primary">{stats.total} Tasks</span>
      </div>
      
      {stats.myTasks > 0 && (
        <div className="flex items-center gap-2 bg-surface-secondary/30 px-3 py-1.5 rounded-xl border border-white/5 shrink-0">
          <User className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] font-bold text-text-primary">{stats.myTasks} Mine</span>
        </div>
      )}

      {stats.overdue > 0 && (
        <div className="flex items-center gap-2 bg-danger/10 px-3 py-1.5 rounded-xl border border-danger/20 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-danger" />
          <span className="text-[11px] font-bold text-danger">{stats.overdue} Overdue</span>
        </div>
      )}

      {stats.urgent > 0 && (
        <div className="flex items-center gap-2 bg-warning/10 px-3 py-1.5 rounded-xl border border-warning/20 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-warning" />
          <span className="text-[11px] font-bold text-warning">{stats.urgent} Urgent</span>
        </div>
      )}

      {stats.dueThisWeek > 0 && (
        <div className="flex items-center gap-2 bg-success/10 px-3 py-1.5 rounded-xl border border-success/20 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-success" />
          <span className="text-[11px] font-bold text-success">{stats.dueThisWeek} Due Soon</span>
        </div>
      )}

      {stats.unassigned > 0 && (
        <div className="flex items-center gap-2 bg-surface-secondary/30 px-3 py-1.5 rounded-xl border border-white/5 shrink-0 opacity-80">
          <User className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] font-bold text-text-secondary">{stats.unassigned} Unassigned</span>
        </div>
      )}
    </div>
  );
};
