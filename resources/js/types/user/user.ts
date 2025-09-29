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

export interface UserPermissions {
    can_view_divisions: boolean;
    can_create_divisions: boolean;
    can_edit_divisions: boolean;
    can_delete_divisions: boolean;
}

export interface UserResponse {
    user: User;
    permissions: UserPermissions;
}