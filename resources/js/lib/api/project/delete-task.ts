import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';

export interface DeleteTaskRequest {
  id: number;
}

export async function deleteTask(data: DeleteTaskRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse<null>>("/project/tasks/delete", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to delete task');
  }
}
