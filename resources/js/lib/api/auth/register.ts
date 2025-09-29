import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { AuthResponse, RegisterRequest } from "@/types/auth/auth";

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AuthResponse>>("/auth/register", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}