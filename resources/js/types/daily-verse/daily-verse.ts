export interface DailyVerse {
    id: number;
    reference: string;
    text: string;
    url: string;
    book: {
        name: string;
        testament: string;
    };
    version: {
        abbreviation: string;
        name: string;
        language: string;
    };
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    scheduled_date: string;
}

export interface DailyVerseResponse {
    id: number;
    reference: string;
    text: string;
    url: string;
}
