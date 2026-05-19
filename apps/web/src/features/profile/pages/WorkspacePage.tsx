import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkspace } from '@/features/workspace/api/workspace.api';
import { Box, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { toast } from 'sonner';


export const WorkspacePage = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const queryClient = useQueryClient();

  const [wsName, setWsName] = useState(activeWorkspace?.name || '');
  const [wsSlug, setWsSlug] = useState(activeWorkspace?.slug || '');

  // Sync state with active workspace
  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsSlug(activeWorkspace.slug);
    }
  }, [activeWorkspace]);

  // Auto-generate slug from name
  useEffect(() => {
    if (wsName && wsName !== activeWorkspace?.name) {
      const slug = wsName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setWsSlug(slug);
    }
  }, [wsName, activeWorkspace?.name]);


  const updateWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      updateWorkspace(activeWorkspace!.id, data),
    onSuccess: (updatedWorkspace) => {
      setActiveWorkspace(updatedWorkspace);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace updated successfully!');
    },
  });


  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceMutation.mutate({ name: wsName, slug: wsSlug });
  };

  return (
    <section className="p-6 rounded-2xl bg-surface-secondary border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
        <Box className="h-5 w-5 text-primary-accent" />
        Workspace Basics
      </h2>

      <form onSubmit={handleUpdateWorkspace} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase">Workspace Name</label>
            <input
              type="text"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/5 text-sm focus:border-primary-accent outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase">Workspace Slug</label>
            <input
              type="text"
              value={wsSlug}
              onChange={(e) => setWsSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/5 text-sm focus:border-primary-accent outline-none transition-all"
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={updateWorkspaceMutation.isPending || (wsName === activeWorkspace?.name && wsSlug === activeWorkspace?.slug)}
        >
          {updateWorkspaceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Workspace Changes
        </Button>
      </form>
    </section>
  );
};
