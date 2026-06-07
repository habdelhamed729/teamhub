import { useAuthStore } from '@/app/store/useAuthStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, HelpCircle, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';

export const Header = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { logout } = useLogout();

  return (
    <header className="h-16 bg-surface-secondary/50 z-3 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 shrink-0">
      {/* Search Bar Placeholder */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search channels, messages, or files..."
            className="w-full bg-surface-elevated border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-accent/30 focus:ring-1 focus:ring-primary-accent/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-text-muted font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-text-muted font-mono">K</kbd>
          </div>
        </div>
      </div>

      {/* Utility Icons */}
      <div className="flex items-center gap-6 ml-8">
        <div className="flex items-center gap-4 text-text-muted border-r border-white/10 pr-6">
          <button className="hover:text-text-primary transition-colors">
            <Clock className="h-5 w-5" />
          </button>
          
          <NotificationDropdown />

          <button className="hover:text-text-primary transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Menu with Navigation */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings/profile')}
            className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
          >
            <div className="hidden md:block">
              <p className="text-sm font-bold">{user?.display_name}</p>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Team Member</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center group relative cursor-pointer hover:border-primary-accent/30 transition-all overflow-hidden shrink-0">
              {user?.avatar_url ? (
                 <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5 text-text-muted group-hover:text-primary-accent transition-colors" />
              )}
              <div className="absolute inset-0 bg-primary-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          
          <Button variant="ghost" size="sm" onClick={logout} className="p-2 h-auto text-text-muted hover:text-danger hover:bg-danger/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
