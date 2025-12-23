import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { Note } from "@/types/note/note";

export interface ListNotesParams {
    page?: number;
    limit?: number;
    filters?: NoteFilters;
    sort?: NoteSorting;
}

export interface NoteFilters {
    search?: string;
    category?: string;
    is_pinned?: boolean;
}

export interface NoteSorting {
    [key: string]: 'asc' | 'desc';
}

export interface NotePagination {
    page: number;
    limit: number;
    total: number | null;
    has_next_page: boolean;
}

export interface NoteListResponse {
    notes: Note[];
    pagination: NotePagination;
}

export async function listNotes(params?: ListNotesParams): Promise<NoteListResponse> {
    const response = await AxiosJosgen.post<ApiResponse<NoteListResponse>>('/note/list', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
