import { AppRouter } from '@/app/router/AppRouter';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </>
  );
}