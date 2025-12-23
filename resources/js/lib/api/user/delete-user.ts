import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { DeleteUserRequest } from "@/types/user/user";

export async function deleteUser(data: DeleteUserRequest): Promise<void> {
    const response = await AxiosJosgen.post<ApiResponse>("/user/delete", data);
    if (!response.data.status) throw new Error(response.data.message);
}