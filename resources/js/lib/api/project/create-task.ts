import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { ProjectTask } from '@/types/project/project';

export interface CreateTaskRequest {
  project_id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: number | null;
}

export interface CreateTaskResponse {
  task: ProjectTask;
}

export async function createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
  const response = await AxiosJosgen.post<ApiResponse<CreateTaskResponse>>("/project/tasks/create", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to create task');
  }
  return response.data.data;
}
