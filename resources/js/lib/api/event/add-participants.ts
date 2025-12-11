import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface AddParticipantsRequest {
  event_id: number;
  user_ids: number[];
}

export interface AddParticipantsResponse {
  event: Event;
}

export async function addParticipants(data: AddParticipantsRequest): Promise<AddParticipantsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AddParticipantsResponse>>("/event/participants/add", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to add participants');
  return response.data.data;
}
