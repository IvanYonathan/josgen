import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { EventResponse, UpdateEventRequest } from "@/types/event/event";

export async function updateEvent(data: UpdateEventRequest): Promise<EventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<EventResponse>>("/event/update", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}