import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export interface DeleteNoteRequest {
    id: number;
}

export async function deleteNote(data: DeleteNoteRequest): Promise<void> {
    const response = await AxiosJosgen.post<ApiResponse<null>>('/note/delete', data);
    if (!response.data.status) throw new Error(response.data.message);
}
