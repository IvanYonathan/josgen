import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Pagination } from '@/types/project/project';
import { AppNotification } from '@/types/notification/notification';

export interface ListNotificationsRequest {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

export interface ListNotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
  pagination: Pagination;
}

export async function listNotifications(data: ListNotificationsRequest = {}): Promise<ListNotificationsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<ListNotificationsResponse>>('/notification/list', data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to fetch notifications');
  }
  return response.data.data;
}

