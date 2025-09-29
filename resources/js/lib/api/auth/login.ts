import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { AuthResponse } from "@/types/auth/auth";


export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AuthResponse>>("/auth/login", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}