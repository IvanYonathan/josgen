import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { CreateEventRequest, EventResponse } from "@/types/event/event";

export async function createEvent(data: CreateEventRequest): Promise<EventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<EventResponse>>("/event/create", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}