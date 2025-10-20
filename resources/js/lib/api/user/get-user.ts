import { AxiosJosgen, ApiResponse } from "@/lib/axios/axios-josgen";
import { GetUserRequest, User } from "@/types/user/user";

// Use POST to match backend routes (routes/api.php -> Route::post('get', ...))
export async function getUser(data: GetUserRequest): Promise<User> {
    const response = await AxiosJosgen.post<ApiResponse<{ user: User }>>(`/user/get`, data);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data.user;
}
