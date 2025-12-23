import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { UpdateProfileRequest } from "@/types/auth/auth";
import { User } from "@/types/user/user";

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const response = await AxiosJosgen.post<ApiResponse<{ user: User }>>("/auth/update-profile", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data.user;
}
