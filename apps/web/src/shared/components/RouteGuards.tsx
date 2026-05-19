import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/useAuthStore';

// Redirects to /login if user is not authenticated
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Redirects to /workspaces if user is already logged in
export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/workspaces" replace /> : <Outlet />;
};

