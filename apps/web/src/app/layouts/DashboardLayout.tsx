import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AISearchModal } from '@/features/ai/components/AISearchModal';

export const DashboardLayout = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K search listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!activeWorkspace) {
    return <Navigate to="/workspaces" replace />;
  }

  return (
    <div className="flex h-screen bg-main-bg text-text-primary overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onSearchClick={() => setIsSearchOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <AISearchModal
        workspaceId={activeWorkspace.id}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};
