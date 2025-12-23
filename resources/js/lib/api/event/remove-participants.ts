import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface RemoveParticipantsRequest {
  event_id: number;
  user_ids: number[];
}

export interface RemoveParticipantsResponse {
  event: Event;
}

export async function removeParticipants(data: RemoveParticipantsRequest): Promise<RemoveParticipantsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RemoveParticipantsResponse>>("/event/participants/remove", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to remove participants');
  return response.data.data;
}
