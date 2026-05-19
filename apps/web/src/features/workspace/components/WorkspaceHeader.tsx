import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Button } from '@/shared/components/Button';

export const WorkspaceHeader = () => {
  const { logout } = useLogout();
  const user = useAuthStore((state) => state.user);

  return (
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
  );
};
