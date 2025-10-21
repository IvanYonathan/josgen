import { AxiosJosgen, ApiResponse } from "@/lib/axios/axios-josgen";
import { GetUserRequest, UserResponse } from "@/types/user/user";

export async function getUser(data: GetUserRequest): Promise<UserResponse> {
    const response = await AxiosJosgen.post<ApiResponse<UserResponse>>(`/user/get`, data);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
