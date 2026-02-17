import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';

export interface MarkNotificationsReadRequest {
  id?: string;
  ids?: string[];
}

export interface MarkNotificationsReadResponse {
  marked_read: number;
  unread_count: number;
}

export async function markNotificationsRead(data: MarkNotificationsReadRequest): Promise<MarkNotificationsReadResponse> {
  const response = await AxiosJosgen.post<ApiResponse<MarkNotificationsReadResponse>>('/notification/mark-read', data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to mark notification(s) as read');
  }
  return response.data.data;
}

