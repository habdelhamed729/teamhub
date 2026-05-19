import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '@/shared/components/RouteGuards';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WorkspaceSelectionPage } from '@/features/workspace/pages/WorkspaceSelectionPage';
import { SettingsLayout } from '@/features/profile/pages/SettingsLayout';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { WorkspacePage } from '@/features/profile/pages/WorkspacePage';




const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/workspaces', element: <WorkspaceSelectionPage /> },
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <div className="p-10 text-white">Welcome to the Dashboard!</div> },
          { 
            path: '/settings', 
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'workspace', element: <WorkspacePage /> },
            ]
          },
        ],
      },


    ],
  },

  {
    path: '/',
    element: <Navigate to="/workspaces" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
