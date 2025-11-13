import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UserProfileResponse } from "@/types/user/user";

export async function me(): Promise<UserProfileResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UserProfileResponse>>("/auth/me", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to get user info');
  return response.data.data;
}
