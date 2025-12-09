import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export interface DeleteImageRequest {
    id: number;
}

export async function deleteImage(data: DeleteImageRequest): Promise<void> {
    const response = await AxiosJosgen.post<ApiResponse<null>>('/image/delete', data);
    if (!response.data.status) throw new Error(response.data.message);
}
