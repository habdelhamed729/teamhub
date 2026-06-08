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
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 bg-surface-secondary/20 p-2 sm:p-3 rounded-2xl border border-white/5 w-full">
      <div className="relative w-full sm:max-w-xs shrink-0">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full h-11 bg-surface-elevated/50 border border-white/5 rounded-xl pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-accent/50 transition-all hover:bg-surface-elevated/80"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
        <div className="min-w-[140px] flex-1 sm:flex-none">
          <WorkSelect<PriorityFilter>
            value={filters.priority}
            onChange={(val) => setFilters(prev => ({ ...prev, priority: val }))}
            options={priorityOptions}
          />
        </div>

        <div className="min-w-[140px] flex-1 sm:flex-none">
          <WorkSelect<DueFilter>
            value={filters.due}
            onChange={(val) => setFilters(prev => ({ ...prev, due: val }))}
            options={dueOptions}
          />
        </div>

        <div className="min-w-[160px] flex-1 sm:flex-none">
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
            className="text-text-muted hover:text-danger rounded-xl px-3 whitespace-nowrap h-11"
            icon={<X className="w-4 h-4" />}
          >
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
};
