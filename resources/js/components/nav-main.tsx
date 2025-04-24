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
  className="relative group sidebar-menu-item px-0 py-0" // Remove extra padding
>
  <div className="flex items-center justify-between w-full">
    <SidebarMenuButton
      asChild
      isActive={item.href === page.url}
      className="flex items-center gap-2 w-full px-2 py-2" // Adjust padding
    >
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
  </div>
</SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarGroup className="px-2 py-0 h-full overflow-y-auto relative z-50">
      <SidebarMenu className="whitespace-normal break-words">
        {renderNavItems(items)}
      </SidebarMenu>
    </SidebarGroup>
  );
}
