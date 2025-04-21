import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react'; // Icons for expand/collapse

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
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
                <SidebarMenuButton asChild isActive={item.href === page.url}>
                    <Link href={item.href} prefetch className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-5 h-5" />} {/* Render the icon */}
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
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {renderNavItems(items)}
            </SidebarMenu>
        </SidebarGroup>
    );
}