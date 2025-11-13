import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DeleteRoleRequest } from "@/types/role/role";

export async function deleteRole(payload: DeleteRoleRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/role/delete", payload);

  if (!response.data.status) {
    throw new Error(response.data.message || "Failed to delete role");
  }
}
