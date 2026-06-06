import type { BoardDetailDTO, TaskDTO } from '@teamhub/shared';

/**
 * Finds which column a task belongs to
 */
export const findColumnOfTask = (board: BoardDetailDTO, taskId: string) => {
  return board.columns.find((col) => col.tasks.some((task) => task.id === taskId));
};

/**
 * Safely clones a board for optimistic updates
 */
export const cloneBoard = (board: BoardDetailDTO): BoardDetailDTO => {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    })),
  };
};

/**
 * Reorders a task within the same column
 */
export const reorderTaskInColumn = (
  board: BoardDetailDTO,
  columnId: string,
  taskId: string,
  newIndex: number
): BoardDetailDTO => {
  const newBoard = cloneBoard(board);
  const column = newBoard.columns.find((col) => col.id === columnId);
  if (!column) return board;

  const oldIndex = column.tasks.findIndex((t) => t.id === taskId);
  if (oldIndex === -1) return board;

  const [removed] = column.tasks.splice(oldIndex, 1);
  column.tasks.splice(newIndex, 0, removed);

  // Update order property (optional, backend usually handles this but good for UI)
  column.tasks = column.tasks.map((task, index) => ({
    ...task,
    order: index,
  }));

  return newBoard;
};

/**
 * Moves a task from one column to another
 */
export const moveTaskBetweenColumns = (
  board: BoardDetailDTO,
  taskId: string,
  fromColumnId: string,
  toColumnId: string,
  newIndex: number
): BoardDetailDTO => {
  const newBoard = cloneBoard(board);
  const fromColumn = newBoard.columns.find((col) => col.id === fromColumnId);
  const toColumn = newBoard.columns.find((col) => col.id === toColumnId);

  if (!fromColumn || !toColumn) return board;

  const taskIndex = fromColumn.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return board;

  const [task] = fromColumn.tasks.splice(taskIndex, 1);
  
  // Update task's column reference
  const updatedTask: TaskDTO = {
    ...task,
    columnId: toColumnId,
  };

  toColumn.tasks.splice(newIndex, 0, updatedTask);

  // Update order in both columns
  fromColumn.tasks = fromColumn.tasks.map((t, i) => ({ ...t, order: i }));
  toColumn.tasks = toColumn.tasks.map((t, i) => ({ ...t, order: i }));

  return newBoard;
};
