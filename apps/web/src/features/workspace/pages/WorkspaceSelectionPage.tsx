import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { Button } from '@/shared/components/Button';
import { Plus, Layout, LogOut } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useState } from 'react';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';


export const WorkspaceSelectionPage = () => {
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useWorkspaces();
  const selectWorkspace = useWorkspaceStore((state) => state.selectWorkspace);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleSelect = (id: string) => {
    selectWorkspace(id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-main-bg text-text-primary flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center">
            <span className="font-bold text-primary-accent text-sm">T</span>
          </div>
          <span className="text-lg font-bold tracking-tight">TeamHub</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.display_name}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-danger hover:bg-danger/10">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

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
              {workspaces && workspaces.length > 0 && workspaces.map((w, index) => (
                <button
                  key={w.id || `ws-${index}`}
                  onClick={() => handleSelect(w.id)}
                  className="group relative p-6 rounded-2xl bg-surface-secondary border border-white/5 hover:border-primary-accent/30 transition-all text-left shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-primary-accent/10 hover:-translate-y-1"
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
                className="p-6 rounded-2xl bg-transparent border-2 border-dashed border-white/10 hover:border-primary-accent/40 hover:bg-primary-accent/5 transition-all text-center flex flex-col items-center justify-center group"
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

      {/* Footer Decorations */}

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-accent/20 to-transparent pointer-events-none" />
    </div>
  );
};
