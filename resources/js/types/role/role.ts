export interface RolePermission {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  permissions: RolePermission[];
  is_protected?: boolean;
}

export interface RoleListResponse {
  roles: Role[];
  permissions: RolePermission[];
  total?: number;
}

export interface RoleResponse {
  role: Role;
}

export interface RoleWithUsersResponse {
  role: Role;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  }>;
  users_count?: number;
}

export interface ListRoleRequest {
  search?: string;
  guard?: string;
}

export interface GetRoleRequest {
  id: number;
  include_users?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  guard_name?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  guard_name?: string;
  permissions?: string[];
}

export interface DeleteRoleRequest {
  id: number;
}
