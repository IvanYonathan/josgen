import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export async function disconnectGoogleCalendar(): Promise<void> {
    const response = await AxiosJosgen.post<ApiResponse<null>>("/google-calendar/disconnect", {});
    if (!response.data.status) throw new Error(response.data.message || "Failed to disconnect");
}
