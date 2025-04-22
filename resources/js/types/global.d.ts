import type { route as routeFn } from 'ziggy-js';
import { PageProps as InertiaPageProps } from '@inertiajs/react';

declare global {
    const route: typeof routeFn;
}


declare module '@inertiajs/react' {
    interface PageProps extends InertiaPageProps {
        auth: {
            user: {
                name: string;
                email: string;
                // Add other user properties if needed
            };
        };
    }
}