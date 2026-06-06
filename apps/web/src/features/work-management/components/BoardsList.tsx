import type { BoardDTO } from '@teamhub/shared';
import { BoardCard } from './BoardCard';

export const BoardsList = ({ boards, workspaceId }: { boards: BoardDTO[]; workspaceId: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} workspaceId={workspaceId} />
      ))}
    </div>
  );
};
