import { useState, useMemo } from 'react';
import type { BoardDetailDTO, TaskPriority } from '@teamhub/shared';

export type DueFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'no_due';
export type PriorityFilter = 'all' | TaskPriority;
export type AssigneeFilter = 'all' | 'me' | 'unassigned' | string;

interface FilterState {
  search: string;
  priority: PriorityFilter;
  due: DueFilter;
  assignee: AssigneeFilter;
}

export const getTaskDueState = (dueDate?: string | Date | null): 'overdue' | 'today' | 'this_week' | 'no_due' | 'future' => {
  if (!dueDate) return 'no_due';
  
  const date = new Date(dueDate);
  const today = new Date();
  
  // Strip time for accurate day comparisons
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (dateOnly < todayOnly) return 'overdue';
  if (dateOnly.getTime() === todayOnly.getTime()) return 'today';
  
  // Check if this week (next 7 days)
  const nextWeek = new Date(todayOnly);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  if (dateOnly > todayOnly && dateOnly <= nextWeek) return 'this_week';
  
  return 'future';
};

export const useBoardTaskFilters = (board?: BoardDetailDTO, currentUserId?: string) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    due: 'all',
    assignee: 'all',
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priority !== 'all') count++;
    if (filters.due !== 'all') count++;
    if (filters.assignee !== 'all') count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: 'all',
      due: 'all',
      assignee: 'all',
    });
  };

  const filteredBoard = useMemo(() => {
    if (!board) return undefined;
    
    // If no filters active, return original board
    if (activeFilterCount === 0) return board;

    const lowerSearch = filters.search.toLowerCase();

    const filteredColumns = board.columns.map(col => {
      const filteredTasks = col.tasks.filter(task => {
        // Search filter
        if (lowerSearch) {
          const matchTitle = task.title.toLowerCase().includes(lowerSearch);
          const matchDesc = task.description?.toLowerCase().includes(lowerSearch);
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority filter
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
          return false;
        }

        // Due filter
        if (filters.due !== 'all') {
          const state = getTaskDueState(task.dueDate);
          if (filters.due === 'no_due' && state !== 'no_due') return false;
          if (filters.due === 'overdue' && state !== 'overdue') return false;
          if (filters.due === 'today' && state !== 'today') return false;
          if (filters.due === 'this_week' && state !== 'this_week' && state !== 'today') return false;
        }

        // Assignee filter
        if (filters.assignee !== 'all') {
          const isUnassigned = task.assignees.length === 0;
          if (filters.assignee === 'unassigned' && !isUnassigned) return false;
          
          if (filters.assignee === 'me') {
            if (!currentUserId || !task.assignees.some(a => a.userId === currentUserId)) return false;
          } else if (filters.assignee !== 'unassigned') {
            if (!task.assignees.some(a => a.userId === filters.assignee)) return false;
          }
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks
      };
    });

    return {
      ...board,
      columns: filteredColumns
    };
  }, [board, filters, activeFilterCount, currentUserId]);

  // Command center stats (unfiltered, based on original board)
  const boardStats = useMemo(() => {
    if (!board) return null;
    
    let total = 0;
    let myTasks = 0;
    let overdue = 0;
    let urgent = 0;
    let unassigned = 0;
    let dueThisWeek = 0;

    board.columns.forEach(col => {
      col.tasks.forEach(task => {
        total++;
        if (currentUserId && task.assignees.some(a => a.userId === currentUserId)) myTasks++;
        
        const dueState = getTaskDueState(task.dueDate);
        if (dueState === 'overdue') overdue++;
        if (dueState === 'this_week' || dueState === 'today') dueThisWeek++;
        
        if (task.priority === 'urgent') urgent++;
        if (task.assignees.length === 0) unassigned++;
      });
    });

    return {
      total,
      myTasks,
      overdue,
      urgent,
      unassigned,
      dueThisWeek
    };
  }, [board, currentUserId]);

  return {
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    filteredBoard,
    boardStats,
    isFiltering: activeFilterCount > 0
  };
};
