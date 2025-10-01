import { useRouteError, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

export function ErrorPage() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-4xl font-bold">Oops!</h1>
          <p className="text-xl text-muted-foreground">Something went wrong</p>
        </div>

        {error && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono text-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
        )}

        <Button asChild>
          <Link to="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}