import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  division_ids: number[]; // Multi-division support
  participant_ids?: number[];
}


export interface CreateEventResponse {
  event: Event;
}

export async function createEvent(data: CreateEventRequest): Promise<CreateEventResponse> {
  const response = await AxiosJosgen.post<ApiResponse<CreateEventResponse>>("/event/create", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to create event');
  return response.data.data;
}