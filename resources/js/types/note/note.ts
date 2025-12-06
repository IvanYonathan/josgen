export interface UserLite {
    id: number;
    name: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    tags?: string[] | null;
    category?: string | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    user?: UserLite;
    user_id: number;
}

export interface NoteResponse {
    note: Note;
}


