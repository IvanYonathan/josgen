export type UserRole = string;

export interface UserDivisionLite {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    // Avatar filename stored by backend ("ava"). Keep optional for compatibility.
    ava?: string;
    // Deprecated: older code may refer to avatar. Retain for compatibility.
    avatar?: string;
    role: UserRole;
    phone?: string;
    birthday?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    // Eager-loaded relation (list endpoints include id+name; detail may include full object)
    division?: UserDivisionLite | null;
    // Many-to-many divisions (from division_members pivot)
    divisions?: UserDivisionLite[];
    // Foreign key may be present in payloads
    division_id?: number | null;
}

export interface UserPermissions {
    // User management
    can_view_users: boolean;
    can_create_users: boolean;
    can_edit_users: boolean;
    can_delete_users: boolean;
    // Role management
    can_view_roles: boolean;
    can_create_roles: boolean;
    can_edit_roles: boolean;
    can_delete_roles: boolean;
    // Permission management
    can_view_permissions: boolean;
    can_create_permissions: boolean;
    can_edit_permissions: boolean;
    can_delete_permissions: boolean;
    // Divisions
    can_view_own_divisions: boolean;
    can_view_all_divisions: boolean;
    can_view_divisions: boolean;
    can_view_division_members: boolean;
    can_create_divisions: boolean;
    can_edit_divisions: boolean;
    can_delete_divisions: boolean;
    // Events
    can_view_events: boolean;
    can_create_events: boolean;
    can_edit_events: boolean;
    can_delete_events: boolean;
    // Projects
    can_view_projects: boolean;
    can_create_projects: boolean;
    can_edit_projects: boolean;
    can_delete_projects: boolean;
    // Todo lists
    can_view_todo_lists: boolean;
    can_create_todo_lists: boolean;
    can_edit_todo_lists: boolean;
    can_delete_todo_lists: boolean;
    // Notes
    can_create_notes: boolean;
    can_edit_notes: boolean;
    can_delete_notes: boolean;
    // Treasury
    can_create_treasury_requests: boolean;
    can_view_own_treasury_requests: boolean;
    can_view_all_treasury_requests: boolean;
    can_approve_treasury_requests: boolean;
    can_process_payments: boolean;
    can_view_treasury_reports: boolean;
}

export interface GetUserRequest {
    id: number;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    birthday?: string;
    division_id?: number;
    ava?: string;
}

export interface UpdateUserRequest {
    id: number;
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    phone?: string;
    birthday?: string;
    division_id?: number;
    ava?: string;
}

export interface DeleteUserRequest{
    id: number;
}

export interface UserResponse {
    user: User;
}

export interface UserProfileResponse extends UserResponse {
    permissions: UserPermissions;
}

export interface UserListResponse {
    users: User[];
    total?: number;
}

export interface UserOption {
    id: number;
    name: string;
    email: string;
    ava?: string | null;
    division_id?: number | null;
    division_ids?: number[];
}

export interface UserOptionsResponse {
    users: UserOption[];
}
