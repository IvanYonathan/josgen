import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { GetRoleRequest, RoleResponse } from "@/types/role/role";

export async function getRole(payload: GetRoleRequest): Promise<RoleResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RoleResponse>>("/role/get", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to load role");
  }

  return response.data.data;
}
