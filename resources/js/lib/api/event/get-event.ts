import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface GetEventRequest {
  id: number;
}

export interface GetEventResponse {
  event: Event;
}

export async function getEvent(data: GetEventRequest): Promise<GetEventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<GetEventResponse>>("/event/get", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to fetch event');
  return response.data.data;
}