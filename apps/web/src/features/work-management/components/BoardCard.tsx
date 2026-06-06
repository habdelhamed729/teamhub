import { Link } from 'react-router-dom';
import type { BoardDTO } from '@teamhub/shared';
import { Calendar, Layout } from 'lucide-react';

export const BoardCard = ({ board, workspaceId }: { board: BoardDTO; workspaceId: string }) => {
  return (
    <Link
      to={`/workspaces/${workspaceId}/tasks/${board.id}`}
      className="group bg-surface-elevated/50 border border-white/5 rounded-xl p-5 hover:border-primary-accent/30 hover:bg-surface-elevated/80 transition-all shadow-sm hover:shadow-premium flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center border border-white/5 group-hover:border-primary-accent/20 transition-colors">
          <Layout className="w-5 h-5 text-text-muted group-hover:text-primary-accent transition-colors" />
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-text-primary mb-2 truncate group-hover:text-primary-accent transition-colors">
        {board.name}
      </h3>
      
      {board.description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-6 flex-1">
          {board.description}
        </p>
      )}
      
      <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-widest font-bold">
        <Calendar className="w-3 h-3" />
        <span>Created {new Date(board.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
};
