import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function NavMain({
  items = [],
  isCollapsed = false,
}: {
  items: NavItem[];
  isCollapsed?: boolean;
}) {
  const page = usePage();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isOpen = openMenus.includes(item.title);
      const hasChildren = !!item.children;

      return (
        <SidebarMenuItem
          key={item.title}
          className="relative group sidebar-menu-item px-2 py-0"
        >
          <div className="flex items-center justify-between w-full">
            <SidebarMenuButton asChild isActive={item.href === page.url}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleMenu(item.title)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.title}</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  prefetch
                  className="flex items-center gap-2 w-full"
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.title}</span>
                </Link>
              )}
            </SidebarMenuButton>

            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleMenu(item.title)}
                className="ml-auto group-data-[collapsible=icon]:hidden"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Submenu logic */}
          {hasChildren && (
            <>
              {!isCollapsed && isOpen && (
                <SidebarMenu className="ml-6 mt-2 border-l border-neutral-200 dark:border-neutral-700 pl-4">
                  {renderNavItems(item.children ?? [])}
                </SidebarMenu>
              )}

              {isCollapsed && (
                <div className="sidebar-floating-submenu">
                  <SidebarMenu>
                    {renderNavItems(item.children ?? [])}
                  </SidebarMenu>
                </div>
              )}
            </>
          )}
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarGroup className="px-2 py-0 h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
      <SidebarMenu className="whitespace-normal break-words">
        {renderNavItems(items)}
      </SidebarMenu>
    </SidebarGroup>
  );
}
