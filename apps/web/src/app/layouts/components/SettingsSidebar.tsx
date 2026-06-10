import { User, Box, Bell, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const SettingsSidebar = () => {
  return (
    <aside className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-none shrink-0 border-b border-white/5 md:border-none">
      <NavLink 
        to="/settings/profile"
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative shrink-0
          ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
        `}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="hidden md:block absolute left-0 top-2 bottom-2 w-[3px] bg-primary-accent rounded-r-full" />
            )}
            <User className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </>
        )}
      </NavLink>
      <NavLink 
        to="/settings/workspace"
        className={({ isActive }) => `
          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative shrink-0
          ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
        `}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="hidden md:block absolute left-0 top-2 bottom-2 w-[3px] bg-primary-accent rounded-r-full" />
            )}
            <Box className="h-4 w-4" />
            <span className="text-sm">Workspace</span>
          </>
        )}
      </NavLink>
      <div className="flex flex-row md:flex-col gap-2 md:pt-4 md:mt-4 md:border-t md:border-white/5">
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-text-secondary opacity-40 cursor-not-allowed shrink-0">
          <Bell className="h-4 w-4" />
          <span className="text-sm">Notifications</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-text-secondary opacity-40 cursor-not-allowed shrink-0">
          <Shield className="h-4 w-4" />
          <span className="text-sm">Security</span>
        </button>
      </div>
    </aside>
  );
};
