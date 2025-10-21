import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UserListResponse } from "@/types/user/user";

export async function listUsers(): Promise<UserListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UserListResponse>>(`/user/list`, {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load users');
  return response.data.data;
}