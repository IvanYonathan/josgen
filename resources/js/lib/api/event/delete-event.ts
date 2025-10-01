import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { DeleteEventRequest } from "@/types/event/event";

export async function deleteEvent(data: DeleteEventRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/event/delete", data);
  if (!response.data.status) throw new Error(response.data.message);
}