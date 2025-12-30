import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";

export interface DeleteEventRequest {
  id: number;
}

export async function deleteEvent(data: DeleteEventRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse<null>>("/event/delete", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to delete event');
}