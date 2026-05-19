import { AppRouter } from '@/app/router/AppRouter';
import { Toaster } from 'sonner';
import { useRefresh } from '@/features/auth/hooks/useRefresh';
import { FullScreenLoader } from '@/shared/components/FullScreenLoader';

export default function App() {
  const { isRefreshing } = useRefresh();

  if (isRefreshing) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </>
  );
}