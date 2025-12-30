import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface UpdateEventRequest {
  id: number;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  division_ids?: number[];
}

export interface UpdateEventResponse {
  event: Event;
}

export async function updateEvent(data: UpdateEventRequest): Promise<UpdateEventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UpdateEventResponse>>("/event/update", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to update event');
  return response.data.data;
}