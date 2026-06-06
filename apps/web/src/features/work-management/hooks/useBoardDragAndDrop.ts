import { useState, useCallback } from 'react';
import { 
  DragStartEvent, 
  DragEndEvent, 
  PointerSensor, 
  TouchSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { BoardDetailDTO, TaskDTO } from '@teamhub/shared';
import { useTaskMutations } from './useTaskMutations';
import { findColumnOfTask } from '../utils/workManagementDnD';

export const useBoardDragAndDrop = (board: BoardDetailDTO) => {
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
  const { moveTask } = useTaskMutations(board.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drag during click
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as TaskDTO;
    if (task) {
      setActiveTask(task);
    }
  }, []);

  const handleDragOver = useCallback(() => {
    // We can use this to show drop indicators if needed
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the source column
    const sourceColumn = findColumnOfTask(board, taskId);
    if (!sourceColumn) return;

    let targetColumnId: string;
    let targetOrder: number;

    // Check if we dropped over a column directly or over another task
    const overData = over.data.current;
    
    if (overData?.type === 'Column') {
      targetColumnId = overId;
      targetOrder = board.columns.find(c => c.id === targetColumnId)?.tasks.length || 0;
    } else if (overData?.type === 'Task') {
      const overTaskColumn = findColumnOfTask(board, overId);
      if (!overTaskColumn) return;
      
      targetColumnId = overTaskColumn.id;
      const overIndex = overTaskColumn.tasks.findIndex(t => t.id === overId);
      targetOrder = overIndex;
    } else {
      return;
    }

    // Don't trigger if nothing changed
    const originalIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
    if (sourceColumn.id === targetColumnId && originalIndex === targetOrder) {
      return;
    }

    // Trigger mutation
    moveTask.mutate({
      taskId,
      payload: {
        columnId: targetColumnId,
        order: targetOrder,
      },
    });
  }, [board, moveTask]);

  return {
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
