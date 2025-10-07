import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { AuthResponse, LoginRequest } from "@/types/auth/auth";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AuthResponse>>("/auth/login", data);
  if (!response.data.status) throw new Error(response.data.message || 'Login failed');
  return response.data.data;
}