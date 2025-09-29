import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { ChangePasswordRequest } from "@/types/auth/auth";

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/auth/change-password", data);
  if (!response.data.success) throw new Error(response.data.message);
}