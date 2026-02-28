import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth-context';

export function ApplicationLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
