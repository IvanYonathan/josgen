import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UserOptionsResponse } from "@/types/user/user";

export async function listUserOptions(): Promise<UserOptionsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UserOptionsResponse>>(`/user/options`);
  if (!response.data.status) throw new Error(response.data.message || "Failed to load user options");
  const data = response.data.data ?? {};
  const users = Array.isArray((data as any).users) ? (data as any).users : [];

  return { users };
}
