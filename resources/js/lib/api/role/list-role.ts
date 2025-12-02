import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ListRoleRequest, RoleListResponse } from "@/types/role/role";

export async function listRoles(payload: ListRoleRequest = {}): Promise<RoleListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RoleListResponse>>("/role/list", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to load roles");
  }

  const data = response.data.data ?? { roles: [], permissions: [] };
  const roles = Array.isArray((data as RoleListResponse).roles) ? (data as RoleListResponse).roles : [];
  const permissions = Array.isArray((data as RoleListResponse).permissions)
    ? (data as RoleListResponse).permissions
    : [];

  const total =
    typeof response.data.total === "number"
      ? response.data.total
      : typeof (data as RoleListResponse).total === "number"
        ? (data as RoleListResponse).total
        : roles.length;

  return {
    roles,
    permissions,
    total,
  };
}
