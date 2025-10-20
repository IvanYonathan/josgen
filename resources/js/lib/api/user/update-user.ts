import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { UpdateUserRequest, User } from "@/types/user/user";

export async function updateUser(
  data: UpdateUserRequest,
  avatarFile?: File
): Promise<User> {
  let response;

  if (avatarFile) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    formData.append("avatar", avatarFile);

    response = await AxiosJosgen.post<ApiResponse<{ user: User }>>(
      `/user/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  } else {
    response = await AxiosJosgen.post<ApiResponse<{ user: User }>>(
      `/user/update`,
      data
    );
  }

  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data.user;
}
