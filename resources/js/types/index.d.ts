import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>; // Ensure the icon accepts className
    children?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Division {
    id: number;
    name: string;
    description: string | null;
    leader_id: number | null;
    leader?: User;
    created_at: string;
    updated_at: string;
    members_count?: number;
    events_count?: number;
    projects_count?: number;
    todo_lists_count?: number;
}

export interface Event {
    id: number;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    location: string | null;
    status: string;
    organizer_id: number;
    division_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    manager_id: number;
    division_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface TodoList {
    id: number;
    title: string;
    type: 'personal' | 'division';
    user_id: number;
    user?: User;
    division_id: number | null;
    created_at: string;
    updated_at: string;
    items?: TodoItem[];
}

export interface TodoItem {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    due_date: string | null;
    priority: string;
    todo_list_id: number;
    assigned_to: number | null;
    created_at: string;
    updated_at: string;
}