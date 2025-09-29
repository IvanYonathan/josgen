import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export async function forgotPassword(email: string): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/auth/forgot-password", { email });
  if (!response.data.success) throw new Error(response.data.message);
}