import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { UserPermissions } from '@/types/user/user';
import { useAuth } from '@/contexts/auth-context';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, CalendarDays, Briefcase, DollarSign, StickyNote, ListTodo, ChevronDown, ChevronRight, UserCog, ShieldCheck } from 'lucide-react';
import AppLogo from './app-logo';
import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';

interface SidebarNavItem extends NavItem {
    permissionKey?: keyof UserPermissions;
    children?: SidebarNavItem[];
}

export function AppSidebar() {
    const location = useLocation();
    const { permissions } = useAuth();
    const { t } = useTranslation('sidebar');
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const mainNavItems: SidebarNavItem[] = [
        {
            title: t('dashboard'),
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: t('userManagement'),
            href: '/users',
            icon: UserCog,
            permissionKey: 'can_view_users',
        },
        {
            title: t('roleManagement'),
            href: '/roles',
            icon: ShieldCheck,
            permissionKey: 'can_view_roles',
        },
        {
            title: t('divisions'),
            href: '/divisions',
            icon: Users,
            permissionKey: 'can_view_divisions',
        },
        {
            title: t('events'),
            href: '/event',
            icon: CalendarDays,
            permissionKey: 'can_view_events',
        },
        {
            title: t('projects'),
            href: '/project',
            icon: Briefcase,
            permissionKey: 'can_view_projects',
        },
        {
            title: t('treasury'),
            href: '/treasury',
            icon: DollarSign,
            permissionKey: 'can_view_own_treasury_requests',
        },
        {
            title: t('notes'),
            href: '/note',
            icon: StickyNote,
            permissionKey: 'can_create_notes',
        },
        {
            title: t('todoLists'),
            href: '/toDoList/personal',
            icon: ListTodo,
            permissionKey: 'can_view_todo_lists',
            children: [
                {
                    title: t('personal'),
                    href: '/toDoList/personal',
                },
                {
                    title: t('division'),
                    href: '/toDoList/division',
                },
            ],
        },
    ];

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) =>
            prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
        );
    };

    const visibleNavItems = useMemo(() => {
        return mainNavItems.filter((item) => {
            if (!item.permissionKey) return true;
            return permissions[item.permissionKey];
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissions, t]);

    const renderNavItems = (items: SidebarNavItem[]) => {
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
                    <SidebarMenu>
                        {renderNavItems(visibleNavItems)}
                    </SidebarMenu>
                </div>
            </SidebarContent>

            <SidebarFooter>

                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
