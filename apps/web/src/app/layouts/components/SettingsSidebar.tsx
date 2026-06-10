import { User, Box, Bell, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const SettingsSidebar = () => {
  return (
    <aside className="space-y-1">
      <NavLink 
        to="/settings/profile"
        className={({ isActive }) => `
          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative
          ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
        `}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary-accent rounded-r-full" />
            )}
            <User className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </>
        )}
      </NavLink>
      <NavLink 
        to="/settings/workspace"
        className={({ isActive }) => `
          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative
          ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
        `}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary-accent rounded-r-full" />
            )}
            <Box className="h-4 w-4" />
            <span className="text-sm">Workspace</span>
          </>
        )}
      </NavLink>
      <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary opacity-50 cursor-not-allowed">
          <Bell className="h-4 w-4" />
          <span className="text-sm">Notifications</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary opacity-50 cursor-not-allowed">
          <Shield className="h-4 w-4" />
          <span className="text-sm">Security</span>
        </button>
      </div>
    </aside>
  );
};
