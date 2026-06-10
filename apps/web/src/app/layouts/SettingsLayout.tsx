import { Outlet } from 'react-router-dom';
import { SettingsSidebar } from './components/SettingsSidebar';

export const SettingsLayout = () => {
  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <p className="text-text-muted text-sm md:text-base">Manage your personal preferences and workspace configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <SettingsSidebar />

        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
