import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export async function logout(): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/auth/logout", {});
  if (!response.data.status) throw new Error(response.data.message || 'Logout failed');
}