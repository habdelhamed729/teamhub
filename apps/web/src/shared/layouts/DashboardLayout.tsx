import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export const DashboardLayout = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  if (!activeWorkspace) {
    return <Navigate to="/workspaces" replace />;
  }


  return (
    <div className="flex h-screen bg-main-bg text-text-primary overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
