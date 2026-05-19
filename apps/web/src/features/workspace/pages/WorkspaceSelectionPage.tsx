import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { Plus, Layout } from 'lucide-react';
import { useState } from 'react';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';
import { WorkspaceHeader } from '../components/WorkspaceHeader';

export const WorkspaceSelectionPage = () => {
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useWorkspaces();
  const selectWorkspace = useWorkspaceStore((state) => state.selectWorkspace);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (id: string) => {
    selectWorkspace(id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-main-bg text-text-primary flex flex-col">
      <WorkspaceHeader />

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Choose your workspace</h1>
            <p className="text-text-secondary text-lg">Select an existing workspace or create a new one to get started.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-surface-secondary border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Workspace Cards */}
              {workspaces && workspaces.length > 0 && workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelect(w.id)}
                  className="group relative cursor-pointer p-6 rounded-2xl bg-surface-secondary border border-white/5 hover:border-primary-accent/30 transition-all text-left shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-primary-accent/10 hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center mb-6 group-hover:bg-primary-accent/10 transition-colors">
                    {w.logo_url ? (
                      <img src={w.logo_url} alt={w.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-xl font-bold text-primary-accent">{w.name?.charAt(0).toUpperCase() || '?'}</span>
                    )}

                  </div>
                  
                  <h3 className="text-xl font-bold mb-1 group-hover:text-primary-accent transition-colors">{w.name || 'Untitled Workspace'}</h3>
                  <p className="text-sm text-text-muted mb-4">teamhub.com/{w.slug || 'unknown'}</p>

                  
                  <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                    <Layout className="h-3 w-3" />
                    <span>Open Workspace</span>
                  </div>
                </button>
              ))}

              {/* Create New Card */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-6 rounded-2xl cursor-pointer bg-transparent border-2 border-dashed border-white/10 hover:border-primary-accent/40 hover:bg-primary-accent/5 transition-all text-center flex flex-col items-center justify-center group"
              >
                <div className="h-12 w-12 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-text-secondary group-hover:text-primary-accent" />
                </div>
                <h3 className="font-bold text-text-primary group-hover:text-primary-accent transition-colors">New Workspace</h3>
                <p className="text-sm text-text-muted mt-1">Start a fresh project</p>
              </button>
            </div>
          )}

        </div>
      </main>

      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-accent/20 to-transparent pointer-events-none" />
    </div>
  );
};
