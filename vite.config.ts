import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    //base: '', //turn on for ngrok or subdomain hosting
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: {
        host: '127.0.0.1', //'127.0.0.1' or 'true' for LAN or ngrok
        port: 5174,
    },
    build: {
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router') || id.includes('scheduler')) return 'vendor-react';
                        if (id.includes('@radix-ui')) return 'vendor-ui';
                        if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
                        if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) return 'vendor-forms';
                        if (id.includes('lucide-react')) return 'vendor-icons';
                        if (id.includes('axios') || id.includes('date-fns')) return 'vendor-utils';
                        if (id.includes('i18next')) return 'vendor-i18n';
                    }
                },
            },
        },
    },
});
