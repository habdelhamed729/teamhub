import { FileText, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../utils/formatTime';

interface RecentDocumentsProps {
  workspaceId: string;
  recentDocuments: any[];
  onWriteDocClick: () => void;
}

export const RecentDocuments = ({
  workspaceId,
  recentDocuments,
  onWriteDocClick,
}: RecentDocumentsProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-elevated/40 border border-white/5 rounded-2xl shadow-premium backdrop-blur-md p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Recent Documents</h2>
          <p className="text-xs text-text-muted mt-0.5">Documents edited recently in the workspace</p>
        </div>
        <Link to={`/workspaces/${workspaceId}/documents`} className="text-xs font-bold text-primary-accent hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recentDocuments.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => navigate(`/workspaces/${workspaceId}/docs/${doc.id}`)}
            className="bg-surface-secondary/30 hover:bg-surface-secondary/70 border border-white/5 hover:border-primary-accent/20 p-5 rounded-xl transition-all cursor-pointer flex flex-col justify-between min-h-[120px] group relative overflow-hidden"
          >
            {/* Subtle Cover Gradient Hover Overlay */}
            {doc.cover_url && (
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${doc.cover_url})` }} />
            )}

            <div className="flex items-start justify-between gap-3 relative">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/5 flex items-center justify-center shrink-0 text-base">
                {doc.icon || '📄'}
              </div>
              <div className="w-6 h-6 rounded-md bg-surface-elevated border border-white/10 flex items-center justify-center overflow-hidden font-bold text-[9px] text-text-primary" title={doc.last_editor?.display_name || doc.creator.display_name}>
                {doc.last_editor?.avatar_url || doc.creator.avatar_url ? (
                  <img src={doc.last_editor?.avatar_url || doc.creator.avatar_url || ''} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  (doc.last_editor?.display_name || doc.creator.display_name || '?').charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="mt-4 relative">
              <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary-accent transition-colors leading-snug">{doc.title}</h4>
              <p className="text-[10px] text-text-muted mt-1 font-medium">
                Edited {formatRelativeTime(doc.updated_at)}
              </p>
            </div>
          </div>
        ))}

        {recentDocuments.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl p-6 bg-surface-secondary/10 text-center">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-white/5 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-text-muted opacity-40" />
            </div>
            <h4 className="text-xs font-bold text-text-primary">No recent documents</h4>
            <p className="text-[11px] text-text-muted max-w-xs mt-1">Write notes, ideas, or audits. Get started by creating a new document.</p>
            <button onClick={onWriteDocClick} className="mt-3 text-xs font-semibold px-4 py-2 bg-primary-accent text-main-bg rounded-lg hover:bg-primary-accent/90 transition-all select-none cursor-pointer">
              Write Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
