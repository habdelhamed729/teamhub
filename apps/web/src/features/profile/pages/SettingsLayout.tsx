import { User, Box, Bell, Shield } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export const SettingsLayout = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-text-muted">Manage your personal preferences and workspace configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-1">
          <NavLink 
            to="/settings/profile"
            className={({ isActive }) => `
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all 
              ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `}
          >
            <User className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </NavLink>
          <NavLink 
            to="/settings/workspace"
            className={({ isActive }) => `
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all 
              ${isActive ? 'bg-primary-accent/10 text-primary-accent font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `}
          >
            <Box className="h-4 w-4" />
            <span className="text-sm">Workspace</span>
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

        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
