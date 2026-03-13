import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';

export interface ClearAllNotificationsResponse {
  deleted: number;
}

export async function clearAllNotifications(): Promise<ClearAllNotificationsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<ClearAllNotificationsResponse>>('/notification/clear-all', {});
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to clear all notifications');
  }
  return response.data.data;
}
