import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';

export interface MarkAllNotificationsReadResponse {
  marked_read: number;
  unread_count: number;
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  const response = await AxiosJosgen.post<ApiResponse<MarkAllNotificationsReadResponse>>('/notification/mark-all-read', {});
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to mark all notifications as read');
  }
  return response.data.data;
}

