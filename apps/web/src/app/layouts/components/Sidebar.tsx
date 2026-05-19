import { useState } from 'react';
import { useWorkspaceStore } from '@/app/store/useWorkspaceStore';
import { useQuery } from '@tanstack/react-query';
import { listWorkspaces } from '@/features/workspace/api/workspace.api';
import { 
  Hash, 
  MessageSquare, 
  CheckSquare, 
  FileText, 
  Settings as SettingsIcon,
  Plus,
  ChevronDown,
  Check
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
  });

  const navItems = [
    { label: 'Channels', icon: Hash, path: '/channels' },
    { label: 'Direct Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { label: 'Documents', icon: FileText, path: '/docs' },
  ];

  return (
    <aside className="w-64 bg-surface-secondary border-r border-white/5 flex flex-col h-full shrink-0">
      {/* Workspace Switcher Component */}
      <div className="p-4 border-b border-white/5 relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all group ${
            isDropdownOpen ? 'bg-surface-elevated border-primary-accent/30' : 'bg-surface-elevated border-white/5 hover:border-primary-accent/30'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary-accent/10 border border-primary-accent/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-accent">
                {activeWorkspace?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <span className="font-bold truncate text-sm">{activeWorkspace?.name || 'Workspace'}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 py-2 rounded-xl bg-surface-elevated border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              My Workspaces
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {workspaces?.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors group"
                >

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 rounded bg-surface-secondary border border-white/5 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold">{ws.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className={`truncate ${ws.id === activeWorkspace?.id ? 'text-primary-accent font-medium' : 'text-text-secondary group-hover:text-text-primary'}`}>
                      {ws.name}
                    </span>
                  </div>
                  {ws.id === activeWorkspace?.id && (
                    <Check className="h-3.5 w-3.5 text-primary-accent" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 px-2">
              <Link
                to="/workspaces"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-primary-accent hover:bg-primary-accent/5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create or Manage Workspaces</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-8">
        <div>
          <h3 className="px-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Workspace</h3>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                  location.pathname.startsWith(item.path) 
                    ? 'bg-primary-accent/10 text-primary-accent font-medium' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <item.icon className={`h-4 w-4 ${location.pathname.startsWith(item.path) ? 'text-primary-accent' : 'text-text-muted group-hover:text-text-primary'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Favorites</h3>
            <button className="text-text-muted hover:text-primary-accent transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <p className="px-2 text-xs text-text-muted italic">No favorites yet</p>
        </div>
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link 
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all group"
        >
          <SettingsIcon className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </aside>


  );
};
