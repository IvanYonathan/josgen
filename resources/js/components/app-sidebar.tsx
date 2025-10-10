import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, useLocation } from 'react-router-dom'; // React Router instead of Inertia
import { BookOpen, Folder, LayoutGrid, Users, CalendarDays, Briefcase, DollarSign, StickyNote, ListTodo, ChevronDown, ChevronRight } from 'lucide-react';
import AppLogo from './app-logo';
import { useState } from 'react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Divisions',
        href: '/divisions',
        icon: Users,
    },
    {
        title: 'Events',
        href: '/event',
        icon: CalendarDays,
    },
    {
        title: 'Projects',
        href: '/project',
        icon: Briefcase,
    },
    {
        title: 'Treasury',
        href: '/treasury',
        icon: DollarSign,
    },
    {
        title: 'Notes',
        href: '/note',
        icon: StickyNote,
    },
    {
        title: 'To-Do Lists',
        href: '/toDoList/personal', // Default to personal
        icon: ListTodo,
        children: [
            {
                title: 'Personal',
                href: '/toDoList/personal',
            },
            {
                title: 'Division',
                href: '/toDoList/division',
            },
        ],
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) =>
            prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
        );
    };

    const renderNavItems = (items: NavItem[]) => {
        return items.map((item) => (
            <SidebarMenuItem key={item.title} className="flex flex-col">
                <div className="flex items-center justify-between">
                    <SidebarMenuButton asChild isActive={item.href === location.pathname || (item.children && item.children.some(child => child.href === location.pathname))}>
                        <Link to={item.href} className="flex items-center gap-2">
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                    {item.children && (
                        <button
                            onClick={() => toggleMenu(item.title)}
                            className="ml-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            {openMenus.includes(item.title) ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
                {item.children && openMenus.includes(item.title) && (
                    <SidebarMenu className="ml-6 mt-2 border-l border-neutral-200 dark:border-neutral-700 pl-4">
                        {renderNavItems(item.children)}
                    </SidebarMenu>
                )}
            </SidebarMenuItem>
        ));
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/dashboard">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="px-2 py-0">
                    <div className="text-sm font-medium text-sidebar-foreground/70 mb-2">
                        Platform
                    </div>
                    <SidebarMenu>
                        {renderNavItems(mainNavItems)}
                    </SidebarMenu>
                </div>
            </SidebarContent>

            <SidebarFooter>
               
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
