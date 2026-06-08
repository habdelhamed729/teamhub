import { X, Search } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import type { DueFilter, PriorityFilter, AssigneeFilter } from '../hooks/useBoardTaskFilters';
import { useMembers } from '@/features/members/hooks/useMembers';
import { WorkSelect, type WorkSelectOption } from './WorkSelect';
import { useMemo } from 'react';

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

  const priorityOptions: WorkSelectOption<PriorityFilter>[] = [
    { value: 'all', label: 'Any Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const dueOptions: WorkSelectOption<DueFilter>[] = [
    { value: 'all', label: 'Any Date' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'no_due', label: 'No Date' },
  ];

  const assigneeOptions: WorkSelectOption<AssigneeFilter>[] = useMemo(() => {
    const baseOptions: WorkSelectOption<AssigneeFilter>[] = [
      { value: 'all', label: 'Any Assignee' },
      { value: 'me', label: 'Assigned to Me' },
      { value: 'unassigned', label: 'Unassigned' },
    ];

    if (members) {
      members.forEach(m => {
        baseOptions.push({
          value: m.user_id,
          label: m.user.display_name,
        });
      });
    }

    return baseOptions;
  }, [members]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-secondary/20 p-3 rounded-2xl border border-white/5 w-full overflow-x-auto scrollbar-none z-40">
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

      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-visible shrink-0">
        <div className="min-w-[140px]">
          <WorkSelect<PriorityFilter>
            value={filters.priority}
            onChange={(val) => setFilters(prev => ({ ...prev, priority: val }))}
            options={priorityOptions}
          />
        </div>

        <div className="min-w-[140px]">
          <WorkSelect<DueFilter>
            value={filters.due}
            onChange={(val) => setFilters(prev => ({ ...prev, due: val }))}
            options={dueOptions}
          />
        </div>

        <div className="min-w-[160px]">
          <WorkSelect<AssigneeFilter>
            value={filters.assignee}
            onChange={(val) => setFilters(prev => ({ ...prev, assignee: val }))}
            options={assigneeOptions}
            searchable
            searchPlaceholder="Find member..."
          />
        </div>

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
