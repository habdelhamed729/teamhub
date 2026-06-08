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
      className={`w-[85vw] sm:w-80 shrink-0 flex flex-col max-h-full bg-surface-secondary/30 rounded-3xl border transition-all duration-300 shadow-sm overflow-hidden ${
        isOver ? 'border-primary-accent/40 bg-primary-accent/5 scale-[1.01]' : 'border-white/5'
      }`}
    >
      {/* Column Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-surface-elevated/10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[0.1em] truncate">
            {column.name}
          </h3>
          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-text-muted">
            {column.tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          onClick={() => onEditColumn(column)}
          icon={<MoreHorizontal className="w-4 h-4" />}
          className="text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg"
        />
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3 min-h-[120px] scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 transition-all">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col min-h-full">
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
            
            {column.tasks.length === 0 && (
              <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-text-muted py-6 px-4 text-center group hover:border-white/10 transition-colors min-h-[100px]">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 opacity-40" />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">No tasks yet</p>
                <button 
                  onClick={() => onAddTask(column.id)}
                  className="mt-2 text-[10px] font-bold text-primary-accent hover:underline uppercase tracking-widest"
                >
                  Create Task
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Column Footer */}
      <div className="p-2 border-t border-white/5 bg-surface-elevated/5">
        <Button
          variant="ghost"
          className="w-full justify-start text-[11px] font-bold text-text-muted hover:text-primary-accent hover:bg-primary-accent/5 rounded-xl transition-all h-9 px-3 group"
          onClick={() => onAddTask(column.id)}
          icon={<Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
};
