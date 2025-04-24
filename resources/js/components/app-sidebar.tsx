import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, NotebookPen, CalendarDays, Lightbulb, ListTodo, Users, Handshake, Cog } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Note',
        href: '/note',
        icon: NotebookPen,
    },
    {
        title: 'To Do List',
        href: '#',
        icon: ListTodo,
        children: [
            {
                title: 'Personal To-Do',
                href: '/toDoList/personal/index', // Matches the route in web.php
            },
            {
                title: 'Division To-Do',
                href: '/toDoList/division/index', // Matches the route in web.php
            },
        ],
    },
    {
        title: 'Divison',
        href: '/division',
        icon: Users,
    },
    {
        title: 'Events',
        href: '/event',
        icon: CalendarDays,
    },
    {
        title: 'Project',
        href: '/project',
        icon: Lightbulb,
    },
    {
        title: 'Treasury',
        href: '/treasury',
        icon: Handshake,
    },
    {
        title: 'Setting',
        href: '#',
        icon: Cog,
        children: [
            {
                title: 'User Setting',
                href: '/setting/userSetting',
            },
            {
                title: 'Permission Setting',
                href: '/setting/permissionSetting',
            },
            {
                title: 'Role Setting',
                href: '/setting/roleSetting',
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="group">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="p-2"> {/* Adjusted padding */}
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}