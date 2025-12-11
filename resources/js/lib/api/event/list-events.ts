import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { Event } from "@/types/event/event";

export interface ListEventsRequest {
  page?: number;
  limit?: number;
  filters?: {
    search?: string;
    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    division_id?: number;
    start_date?: string;
    end_date?: string;
  };
  sort?: Record<string, 'asc' | 'desc'>;
}

export interface ListEventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next_page: boolean;
  };
}

export async function listEvents(data: ListEventsRequest = {}): Promise<ListEventsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<ListEventsResponse>>("/event/list", data);
  if (!response.data.status) throw new Error(response.data.message || 'Failed to fetch events');
  return response.data.data;
}