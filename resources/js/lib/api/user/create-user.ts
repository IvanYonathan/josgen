import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { CreateUserRequest, UserResponse } from "@/types/user/user";

export async function createUser(data: CreateUserRequest, avatarFile?: File): Promise<UserResponse> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'ava') {
            return;
        }
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }

    const response = await AxiosJosgen.post<ApiResponse<UserResponse>>(`/user/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
