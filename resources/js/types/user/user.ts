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
    // Foreign key may be present in payloads
    division_id?: number | null;
}

export interface UserPermissions {
    can_view_divisions: boolean;
    can_create_divisions: boolean;
    can_edit_divisions: boolean;
    can_delete_divisions: boolean;
    can_view_users: boolean;
    can_create_users: boolean;
    can_edit_users: boolean;
    can_delete_users: boolean;
    can_view_roles: boolean;
    can_create_roles: boolean;
    can_edit_roles: boolean;
    can_delete_roles: boolean;
    can_view_permissions: boolean;
    can_create_permissions: boolean;
    can_edit_permissions: boolean;
    can_delete_permissions: boolean;
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
