import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { EventResponse, GetEventRequest } from "@/types/event/event";

export async function getEvent(data: GetEventRequest): Promise<EventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<EventResponse>>("/event/get", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}