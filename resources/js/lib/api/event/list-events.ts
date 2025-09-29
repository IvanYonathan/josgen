import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { EventListResponse, ListEventsRequest } from "@/types/event/event";

export async function listEvents(data: ListEventsRequest = {}): Promise<EventListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<EventListResponse>>("/event/list", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}