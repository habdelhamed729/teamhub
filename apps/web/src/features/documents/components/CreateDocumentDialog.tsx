import { useState, useEffect } from 'react';
import { X, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateDocument } from '../hooks/useDocuments';
import { toast } from 'sonner';
import { Button } from '@/shared/components/Button';

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-accent to-blue-500" />
        
        <div className="flex justify-between items-center p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-accent/10 rounded-lg">
              <FilePlus className="w-5 h-5 text-primary-accent" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">New Document</h2>
          </div>
          <Button 
            variant="ghost"
            iconOnly
            size="sm"
            onClick={onClose}
            icon={<X className="w-5 h-5" />}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors border border-transparent"
          />
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
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              isLoading={isPending}
              variant="primary"
              size="sm"
            >
              Create Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
