import React from 'react';
import { DndContext, DragOverlay, closestCorners, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import type { BoardDetailDTO } from '@teamhub/shared';
import { useBoardDragAndDrop } from '../hooks/useBoardDragAndDrop';
import { TaskCard } from './TaskCard';

interface BoardDragDropProviderProps {
  board: BoardDetailDTO;
  disabled?: boolean;
  children: React.ReactNode;
}

export const BoardDragDropProvider = ({ board, disabled, children }: BoardDragDropProviderProps) => {
  const { 
    activeTask, 
    sensors, 
    handleDragStart, 
    handleDragOver, 
    handleDragEnd 
  } = useBoardDragAndDrop(board);

  return (
    <DndContext
      sensors={disabled ? [] : sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}
      >
        {activeTask ? (
          <div className="w-80 pointer-events-none opacity-90 scale-105 rotate-2 transition-transform duration-200">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
