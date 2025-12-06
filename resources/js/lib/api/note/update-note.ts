import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { NoteResponse } from "@/types/note/note";

export interface UpdateNoteRequest {
    id: number;
    title?: string;
    content?: string;
    tags?: string[];
    category?: string;
    is_pinned?: boolean;
}

export async function updateNote(data: UpdateNoteRequest): Promise<NoteResponse> {
    const response = await AxiosJosgen.post<ApiResponse<NoteResponse>>('/note/update', data);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
