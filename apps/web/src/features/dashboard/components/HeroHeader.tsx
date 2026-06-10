import { Users } from 'lucide-react';
import type { DashboardWorkspaceDTO, DashboardTaskStatsDTO } from '../api/dashboard.api';

interface HeroHeaderProps {
  displayName: string | undefined;
  taskStats: DashboardTaskStatsDTO;
  workspace: DashboardWorkspaceDTO;
}

export const HeroHeader = ({ displayName, taskStats, workspace }: HeroHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          Welcome back, {displayName}!
        </h1>
        <p className="text-sm text-text-muted mt-2">
          You have <span className="text-primary-accent font-semibold">{taskStats.todo + taskStats.inProgress} active tasks</span>, and {taskStats.overdue > 0 ? (
            <span className="text-danger font-semibold">{taskStats.overdue} tasks are overdue</span>
          ) : (
            <span>0 tasks are overdue</span>
          )}. Let's get to work.
        </p>
      </div>

      {/* Workspace Brand Card */}
      <div className="flex items-center gap-4 bg-surface-elevated/40 border border-white/5 px-5 py-4 rounded-2xl shadow-premium backdrop-blur-md shrink-0">
        <div className="w-11 h-11 bg-primary-accent/10 border border-primary-accent/20 rounded-xl flex items-center justify-center font-bold text-lg text-primary-accent">
          {workspace.logo_url ? (
            <img src={workspace.logo_url} alt={workspace.name} className="w-full h-full object-contain" />
          ) : (
            workspace.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-text-primary">{workspace.name}</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary-accent bg-primary-accent/10 rounded uppercase border border-primary-accent/15">
              {workspace.plan}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {workspace.memberCount} Members
          </p>
        </div>
      </div>
    </div>
  );
};
