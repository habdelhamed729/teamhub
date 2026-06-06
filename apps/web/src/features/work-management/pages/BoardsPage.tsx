import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoards, useBoardMutations } from '../hooks/useBoards';
import { BoardEmptyState } from '../components/BoardEmptyState';
import { BoardSkeleton } from '../components/BoardSkeleton';
import { BoardsList } from '../components/BoardsList';
import { BoardModal } from '../components/BoardModal';
import { Button } from '@/shared/components/Button';
import { Plus, RefreshCcw } from 'lucide-react';

export const BoardsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: boards, isLoading, isError, refetch } = useBoards(workspaceId || '');
  const { createBoard } = useBoardMutations(workspaceId || '');

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 bg-surface-elevated animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-surface-elevated animate-pulse rounded-xl" />
        </div>
        <BoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <h2 className="text-xl font-bold text-text-primary mb-4">Failed to load boards</h2>
        <Button 
          variant="secondary" 
          onClick={() => refetch()}
          icon={<RefreshCcw className="w-4 h-4" />}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workspace Boards</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage your project boards and workflows
          </p>
        </div>
        
        {boards && boards.length > 0 && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Board
          </Button>
        )}
      </div>

      {!boards || boards.length === 0 ? (
        <BoardEmptyState onCreateBoard={() => setIsModalOpen(true)} />
      ) : (
        <BoardsList boards={boards} workspaceId={workspaceId || ''} />
      )}

      <BoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Board"
        isLoading={createBoard.isPending}
        onSave={(data) => {
          createBoard.mutate({
            workspaceId: workspaceId || '',
            name: data.name,
            description: data.description,
          }, {
            onSuccess: () => setIsModalOpen(false)
          });
        }}
      />
    </div>
  );
};
