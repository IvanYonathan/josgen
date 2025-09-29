import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UserResponse } from "@/types/user/user";

export async function me(): Promise<UserResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UserResponse>>("/auth/me", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to get user info');
  return response.data.data;
}