import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UpdateUserRequest, UserResponse } from "@/types/user/user";

export async function updateUser(data: UpdateUserRequest, avatarFile?: File): Promise<UserResponse> {
  let response;

  if (avatarFile) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    formData.append("avatar", avatarFile);

    response = await AxiosJosgen.post<ApiResponse<UserResponse>>(
      `/user/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  } else {
    response = await AxiosJosgen.post<ApiResponse<UserResponse>>(
      `/user/update`,
      data
    );
  }

  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}
