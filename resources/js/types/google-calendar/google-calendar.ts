export interface GoogleCalendarStatus {
    connected: boolean;
    google_email: string | null;
    connected_at: string | null;
    synced_events_count: number;
}

export interface GoogleCalendarConnectResponse {
    auth_url: string;
}
