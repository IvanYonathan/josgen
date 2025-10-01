import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export async function resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/auth/reset-password", data);
  if (!response.data.status) throw new Error(response.data.message);
}