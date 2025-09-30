import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { me } from '@/lib/api/auth/me';
import { User } from '@/types/user/user';
import { Loader2 } from 'lucide-react';
import { TokenManager } from '@/lib/auth/token-manager';

export function ApplicationLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial user data
  useEffect(() => {
    const loadUser = async () => {
      if (!TokenManager.isAuthenticated()) {
        console.log('No auth token found, redirecting to login');
        navigate('/login', { replace: true });
        setLoading(false);
        return;
      }

      try {
        const response = await me();
        setUser(response.user);
      } catch (error) {
        console.error('Failed to load user:', error);
        TokenManager.clearTokens();
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

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

  // If user is not loaded, show nothing (will redirect)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <Outlet context={{ user }} />;
}