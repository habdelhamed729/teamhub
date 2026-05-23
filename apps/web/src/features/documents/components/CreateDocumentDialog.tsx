import { useState } from 'react';
import { X, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateDocument } from '../hooks/useDocuments';

import { toast } from 'sonner';

interface CreateDocumentDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  parentId?: string | null;
}

export const CreateDocumentDialog = ({ workspaceId, isOpen, onClose, parentId = null }: CreateDocumentDialogProps) => {
  const [title, setTitle] = useState('');
  const { mutateAsync: createDoc, isPending } = useCreateDocument(workspaceId);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const toastId = toast.loading('Creating document...');

    try {
      const doc = await createDoc({ 
        title: title.trim(), 
        parent_id: parentId || undefined 
      });
      toast.success('Document created successfully', { id: toastId });
      onClose();
      setTitle('');
      navigate(`/workspaces/${workspaceId}/docs/${doc.id}`);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to create document';
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-main-bg/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-secondary border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-accent to-blue-500" />
        
        <div className="flex justify-between items-center p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-accent/10 rounded-lg">
              <FilePlus className="w-5 h-5 text-primary-accent" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">New Document</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1.5">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q3 Marketing Plan"
                className="w-full bg-main-bg border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-accent focus:ring-1 focus:ring-primary-accent transition-all"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="px-5 py-2 bg-primary-accent text-main-bg text-sm font-bold rounded-xl hover:bg-[#4CD5C0] focus:ring-2 focus:ring-primary-accent/50 focus:ring-offset-2 focus:ring-offset-surface-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_15px_-3px_rgba(94,234,212,0.4)]"
            >
              {isPending ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
