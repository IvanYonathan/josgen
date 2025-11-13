export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionListResponse {
  permissions: Permission[];
  total?: number;
}

export interface PermissionResponse {
  permission: Permission;
}

export interface ListPermissionRequest {
  search?: string;
  guard?: string;
}

export interface GetPermissionRequest {
  id: number;
}

export interface CreatePermissionRequest {
  name: string;
  guard_name?: string;
}

export interface UpdatePermissionRequest extends CreatePermissionRequest {
  id: number;
}

export interface DeletePermissionRequest {
  id: number;
}
