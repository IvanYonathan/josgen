import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { GetRoleRequest, RoleResponse, RoleWithUsersResponse } from "@/types/role/role";

export async function getRole(payload: GetRoleRequest): Promise<RoleResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RoleResponse>>("/role/get", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to load role");
  }

  return response.data.data;
}

export async function getRoleWithUsers(payload: GetRoleRequest): Promise<RoleWithUsersResponse> {
  const requestPayload = { ...payload, include_users: true };
  const response = await AxiosJosgen.post<ApiResponse<RoleWithUsersResponse>>("/role/get", requestPayload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to load role with users");
  }

  return response.data.data;
}
