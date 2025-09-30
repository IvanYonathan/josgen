import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { me } from '@/lib/api/auth/me';
import { User } from '@/types/user/user';
import { Loader2 } from 'lucide-react';

export function ApplicationLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await me();
        setUser(response.user);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Handle auth error - could redirect to login
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return <Outlet context={{ user }} />;
}