import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { ProjectTask } from '@/types/project/project';

export interface UpdateTaskRequest {
  id: number;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: number | null;
  is_completed?: boolean;
}

export interface UpdateTaskResponse {
  task: ProjectTask;
}

export async function updateTask(data: UpdateTaskRequest): Promise<UpdateTaskResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UpdateTaskResponse>>("/project/tasks/update", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to update task');
  }
  return response.data.data;
}
