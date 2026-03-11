import { TokenManager } from './token-manager';

interface PrefetchedAuth {
    promise: Promise<any> | null;
    data: any | null;
    error: any | null;
}

const prefetched: PrefetchedAuth = {
    promise: null,
    data: null,
    error: null,
};

/**
 * Start fetching /auth/me as early as possible (before React mounts).
 * The AuthProvider will consume the result instead of making a duplicate call.
 */
export function prefetchAuth(): void {
    if (!TokenManager.isAuthenticated()) return;

    const token = TokenManager.getAccessToken();
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

    prefetched.promise = fetch(`${baseUrl}/auth/me`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: '{}',
    })
        .then(res => res.json())
        .then(json => {
            if (json.status && json.data) {
                prefetched.data = json.data;
                return json.data;
            }
            throw new Error(json.message || 'Auth prefetch failed');
        })
        .catch(err => {
            prefetched.error = err;
            throw err;
        });
}

/**
 * Consume the prefetched auth data. Returns the promise if still pending,
 * or resolves immediately if data is already available.
 * Returns null if prefetch was never started.
 */
export function consumePrefetchedAuth(): Promise<any> | null {
    return prefetched.promise;
}

/**
 * Clear prefetched data (e.g., on logout or refresh).
 */
export function clearPrefetchedAuth(): void {
    prefetched.promise = null;
    prefetched.data = null;
    prefetched.error = null;
}
