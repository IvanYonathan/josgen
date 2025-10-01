import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { AuthResponse, RegisterRequest } from "@/types/auth/auth";

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AuthResponse>>("/auth/register", data);
  if (!response.data.status) throw new Error(response.data.message || 'Registration failed');
  return response.data.data;
}