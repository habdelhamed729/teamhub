import type { BoardColumnDTO, TaskDTO } from '@teamhub/shared';
import { TaskCard } from './TaskCard';
import { Button } from '@/shared/components/Button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';

interface BoardColumnProps {
  column: BoardColumnDTO & { tasks: TaskDTO[] };
  onAddTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
  onEditColumn: (column: BoardColumnDTO) => void;
}

export const BoardColumn = ({ column, onAddTask, onTaskClick, onEditColumn }: BoardColumnProps) => {
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 shrink-0 flex flex-col max-h-full bg-surface-secondary/40 rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
        isOver ? 'border-primary-accent/30 bg-primary-accent/5' : 'border-white/5'
      }`}
    >
      {/* Column Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-white/5 bg-surface-elevated/20">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest truncate">
            {column.name}
          </h3>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-text-muted">
            {column.tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={() => onEditColumn(column)}
          icon={<MoreHorizontal className="w-4 h-4" />}
          className="text-text-muted hover:text-text-primary"
        />
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3 min-h-[100px] scrollbar-thin scrollbar-thumb-white/5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        
        {column.tasks.length === 0 && (
          <div className="border-2 border-dashed border-white/5 rounded-xl h-24 flex items-center justify-center text-text-muted text-[10px] uppercase font-bold tracking-widest">
            Empty
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="p-2 border-t border-white/5">
        <Button
          variant="ghost"
          className="w-full justify-start text-xs font-bold text-text-muted hover:text-primary-accent hover:bg-primary-accent/5 rounded-xl transition-all"
          onClick={() => onAddTask(column.id)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
};
