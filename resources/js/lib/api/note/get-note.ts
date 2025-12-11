import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { NoteResponse } from "@/types/note/note";

export interface GetNoteRequest {
    id: number;
}

export async function getNote(data: GetNoteRequest): Promise<NoteResponse> {
    const response = await AxiosJosgen.post<ApiResponse<NoteResponse>>('/note/get', data);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
