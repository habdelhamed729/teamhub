import { useMemo } from 'react';
import { CheckSquare, Flame, TrendingUp, FileText, MessageSquare } from 'lucide-react';
import type { DashboardTaskStatsDTO, DashboardWorkloadDTO, DashboardActivityDTO } from '../api/dashboard.api';
import { formatRelativeTime } from '../utils/formatTime';

interface MetricsRowProps {
  taskStats: DashboardTaskStatsDTO;
  workload: DashboardWorkloadDTO;
  activities: DashboardActivityDTO[];
}

export const MetricsRow = ({ taskStats, workload, activities }: MetricsRowProps) => {
  const workloadPointsRatio = useMemo(() => {
    return Math.min(1, workload.currentPoints / workload.capacityLimit);
  }, [workload]);

  const workloadStatus = useMemo(() => {
    const points = workload.currentPoints;
    if (points > 9) {
      return { 
        label: 'Overload', 
        colorClass: 'text-danger bg-danger/10 border-danger/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.4)] animate-pulse', 
        barClass: 'from-rose-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
      };
    }
    if (points > 6) {
      return { label: 'Caution', colorClass: 'text-warning bg-warning/10 border-warning/20', barClass: 'from-amber-400 to-orange-500' };
    }
    return { label: 'Healthy', colorClass: 'text-success bg-success/10 border-success/20', barClass: 'from-sky-400 to-emerald-400' };
  }, [workload]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* My Tasks Widget */}
      <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-text-muted" /> My Tasks
          </h3>
          <span className="text-xs font-bold text-text-muted">{taskStats.totalActive} Active</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-secondary/50 rounded-xl p-3 text-center border border-white/5">
            <div className="text-2xl font-bold text-text-primary">{taskStats.todo}</div>
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">To Do</div>
          </div>
          <div className="bg-primary-accent/5 rounded-xl p-3 text-center border border-primary-accent/10">
            <div className="text-2xl font-bold text-primary-accent">{taskStats.inProgress}</div>
            <div className="text-[10px] text-primary-accent/80 font-bold uppercase tracking-wider mt-1">Doing</div>
          </div>
          <div className={`rounded-xl p-3 text-center border ${taskStats.overdue > 0 ? 'bg-danger/5 border-danger/10 text-danger' : 'bg-surface-secondary/50 border-white/5 text-text-muted'}`}>
            <div className="text-2xl font-bold">{taskStats.overdue}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1">Overdue</div>
          </div>
        </div>
      </div>

      {/* Live Workload Capacity Bar */}
      <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <Flame className="w-4 h-4 text-text-muted" /> Capacity
          </h3>
          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded border ${workloadStatus.colorClass}`}>
            {workloadStatus.label}
          </span>
        </div>

        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-text-muted">
            <span>Current Workload</span>
            <span className="text-text-primary">{workload.currentPoints} / {workload.capacityLimit} Points</span>
          </div>
          <div className="h-3 w-full bg-surface-secondary rounded-full overflow-hidden p-[2px] border border-white/5">
            <div 
              className={`h-full bg-linear-to-r rounded-full transition-all duration-500 ${workloadStatus.barClass}`}
              style={{ width: `${workloadPointsRatio * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted leading-relaxed mt-2 border-t border-white/5 pt-2 select-none">
            Weighted by task priority: Low (1pt), Medium (2pts), High (3pts), Urgent (5pts) against a capacity threshold of 10.
          </p>
        </div>
      </div>

      {/* Recent Updates Mini Feed */}
      <div className="bg-surface-elevated/40 border border-white/5 p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-muted" /> Activity
          </h3>
          <span className="text-xs font-bold text-text-muted">Live logs</span>
        </div>

        <div className="space-y-3.5 max-h-24 overflow-y-auto scrollbar-none">
          {activities.slice(0, 3).map((act) => (
            <div key={act.id} className="flex items-center gap-3 text-xs">
              <div className="w-6 h-6 rounded-md bg-surface-secondary flex items-center justify-center shrink-0 border border-white/5 text-text-muted">
                {act.type.includes('task') ? <CheckSquare className="w-3 h-3" /> : act.type.includes('document') ? <FileText className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
              </div>
              <div className="truncate flex-1 text-text-secondary">
                <span className="font-bold text-text-primary">{act.user.display_name}</span>{' '}
                {act.type.includes('created') ? 'created' : 'updated'}{' '}
                <span className="font-medium text-text-primary">{act.targetName}</span>
              </div>
              <span className="text-[10px] text-text-muted font-semibold shrink-0">{formatRelativeTime(act.timestamp)}</span>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-4">No recent activity logs</p>
          )}
        </div>
      </div>
    </div>
  );
};
