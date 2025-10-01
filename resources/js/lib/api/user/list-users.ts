import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { User } from "@/types/user/user";

export interface ListUsersResponse {
  users: User[];
  total: number;
}

export async function listUsers(): Promise<ListUsersResponse> {
  const response = await AxiosJosgen.post<ApiResponse<User[]>>("/user/list", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load users');
  return {
    users: response.data.data,
    total: response.data.total || response.data.data.length
  };
}