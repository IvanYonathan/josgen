import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { CreateUserRequest, User } from "@/types/user/user";

export async function createUser(data: CreateUserRequest, avatarFile?: File): Promise<User> {
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

    const response = await AxiosJosgen.post<ApiResponse<{ user: User }>>('/user/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data.user;
}
