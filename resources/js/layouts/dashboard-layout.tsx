import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Outlet, useLocation } from 'react-router-dom';
import { type BreadcrumbItem } from '@/types';

export function DashboardLayout() {
  const location = useLocation();

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add specific breadcrumbs based on route
    if (path === '/dashboard' || path === '/') {
      breadcrumbs.push({ title: 'Dashboard', href: '/dashboard' });
    } else if (path === '/divisions') {
      breadcrumbs.push({ title: 'Divisions', href: '/divisions' });
    } else if (path === '/event') {
      breadcrumbs.push({ title: 'Events', href: '/event' });
    } else if (path === '/project') {
      breadcrumbs.push({ title: 'Projects', href: '/project' });
    } else if (path === '/treasury') {
      breadcrumbs.push({ title: 'Treasury', href: '/treasury' });
    } else if (path === '/note') {
      breadcrumbs.push({ title: 'Notes', href: '/note' });
    } else if (path === '/toDoList/personal') {
      breadcrumbs.push({ title: 'Personal To-Do', href: '/toDoList/personal' });
    } else if (path === '/toDoList/division') {
      breadcrumbs.push({ title: 'Division To-Do', href: '/toDoList/division' });
    } else if (path === '/settings/profile') {
      breadcrumbs.push({ title: 'Profile settings', href: '/settings/profile' });
    } else if (path === '/settings/password') {
      breadcrumbs.push({ title: 'Password settings', href: '/settings/password' });
    } else if (path === '/settings/appearance') {
      breadcrumbs.push({ title: 'Appearance settings', href: '/settings/appearance' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <AppShell variant="sidebar">
      <AppSidebar />
      <AppContent variant="sidebar">
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        <Outlet />
      </AppContent>
    </AppShell>
  );
}