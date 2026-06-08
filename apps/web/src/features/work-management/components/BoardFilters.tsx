import { X, Search } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import type { DueFilter, PriorityFilter, AssigneeFilter } from '../hooks/useBoardTaskFilters';
import { useMembers } from '@/features/members/hooks/useMembers';

interface BoardFiltersProps {
  filters: {
    search: string;
    priority: PriorityFilter;
    due: DueFilter;
    assignee: AssigneeFilter;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    priority: PriorityFilter;
    due: DueFilter;
    assignee: AssigneeFilter;
  }>>;
  activeFilterCount: number;
  clearFilters: () => void;
  workspaceId: string;
}

export const BoardFilters = ({ filters, setFilters, activeFilterCount, clearFilters, workspaceId }: BoardFiltersProps) => {
  const { data: members } = useMembers(workspaceId);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-secondary/20 p-3 rounded-2xl border border-white/5 w-full overflow-x-auto scrollbar-none">
      <div className="relative w-full sm:w-64 shrink-0">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full bg-surface-elevated/50 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none shrink-0">
        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as PriorityFilter }))}
          className="bg-surface-elevated/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 cursor-pointer appearance-none min-w-[110px]"
        >
          <option value="all">Any Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filters.due}
          onChange={(e) => setFilters(prev => ({ ...prev, due: e.target.value as DueFilter }))}
          className="bg-surface-elevated/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 cursor-pointer appearance-none min-w-[110px]"
        >
          <option value="all">Any Date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="no_due">No Date</option>
        </select>

        <select
          value={filters.assignee}
          onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value as AssigneeFilter }))}
          className="bg-surface-elevated/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-accent/50 cursor-pointer appearance-none min-w-[130px]"
        >
          <option value="all">Any Assignee</option>
          <option value="me">Assigned to Me</option>
          <option value="unassigned">Unassigned</option>
          {members?.map(m => (
            <option key={m.user_id} value={m.user_id}>{m.user.display_name}</option>
          ))}
        </select>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-text-muted hover:text-danger rounded-xl px-3 whitespace-nowrap shrink-0"
            icon={<X className="w-3.5 h-3.5" />}
          >
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};
