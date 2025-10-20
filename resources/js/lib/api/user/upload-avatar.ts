import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { User } from "@/types/user/user";

export async function uploadAvatar(formData: FormData): Promise<User> {
    const response = await AxiosJosgen.post<ApiResponse<{ user: User }>>(
        '/users/upload-avatar',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data.user;
}