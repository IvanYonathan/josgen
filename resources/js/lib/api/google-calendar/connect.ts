import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { GoogleCalendarConnectResponse } from "@/types/google-calendar/google-calendar";

export async function connectGoogleCalendar(): Promise<GoogleCalendarConnectResponse> {
    const response = await AxiosJosgen.post<ApiResponse<GoogleCalendarConnectResponse>>("/google-calendar/connect", {});
    if (!response.data.status) throw new Error(response.data.message || "Failed to generate auth URL");
    return response.data.data;
}
