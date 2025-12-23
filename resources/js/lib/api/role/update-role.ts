import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { RoleResponse, UpdateRoleRequest } from "@/types/role/role";

export async function updateRole(payload: UpdateRoleRequest): Promise<RoleResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RoleResponse>>("/role/update", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to update role");
  }

  return response.data.data;
}
