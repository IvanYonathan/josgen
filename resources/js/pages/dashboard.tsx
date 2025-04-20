import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const userName = "John Doe"; // Replace with dynamic user data if available

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            {/* Welcome Section */}
            <div className="flex flex-col p-6 rounded-xl">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Welcome, {userName}
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Check your activities
                </p>
            </div>

            {/* Content Section */}
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 mt-6">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* To-Do List Card */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <Link href="/toDoList" className="absolute inset-0">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                    To-Do List
                                </h2>
                            </div>
                        </Link>
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}