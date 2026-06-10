import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AISearchModal } from '@/features/ai/components/AISearchModal';

export const DashboardLayout = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    <div className="flex h-screen bg-main-bg text-text-primary overflow-hidden relative">
      {/* Mobile Sidebar Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          onSearchClick={() => setIsSearchOpen(true)} 
          onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
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
