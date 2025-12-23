import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { CreateRoleRequest, RoleResponse } from "@/types/role/role";

export async function createRole(payload: CreateRoleRequest): Promise<RoleResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RoleResponse>>("/role/create", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to create role");
  }

  return response.data.data;
}
