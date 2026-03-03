import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { GoogleCalendarStatus } from "@/types/google-calendar/google-calendar";

export async function fetchGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
    const response = await AxiosJosgen.post<ApiResponse<GoogleCalendarStatus>>("/google-calendar/status", {});
    if (!response.data.status) throw new Error(response.data.message || "Failed to fetch status");
    return response.data.data;
}
