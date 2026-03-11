import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { me } from '@/lib/api/auth/me';
import { TokenManager } from '@/lib/auth/token-manager';
import { consumePrefetchedAuth, clearPrefetchedAuth } from '@/lib/auth/auth-prefetch';
import { User, UserPermissions } from '@/types/user/user';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface AuthContextValue {
    user: User;
    permissions: UserPermissions;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const { t } = useTranslation('common');
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);
    const prefetchConsumed = useRef(false);

    const loadUser = useCallback(async () => {
        if (!TokenManager.isAuthenticated()) {
            globalThis.location.href = '/login';
            return;
        }

        try {
            // On first mount, try to use the prefetched auth data
            let response;
            const prefetchedPromise = !prefetchConsumed.current ? consumePrefetchedAuth() : null;
            prefetchConsumed.current = true;

            if (prefetchedPromise) {
                response = await prefetchedPromise;
                clearPrefetchedAuth();
            } else {
                response = await me();
            }

            setUser(response.user);
            setPermissions(response.permissions);
        } catch (error) {
            console.error('Failed to load user:', error);
            TokenManager.clearTokens();
            globalThis.location.href = '/login';
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    if (loading || !user || !permissions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('loadingApplication')}</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, permissions, refreshUser: loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
