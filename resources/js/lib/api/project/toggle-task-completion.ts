import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { ProjectTask } from '@/types/project/project';

export interface ToggleTaskCompletionRequest {
  task_ids: number[];
}

export interface ToggleTaskCompletionResponse {
  tasks: ProjectTask[];
  toggled_count: number;
}

export async function toggleTaskCompletion(data: ToggleTaskCompletionRequest): Promise<ToggleTaskCompletionResponse> {
  const response = await AxiosJosgen.post<ApiResponse<ToggleTaskCompletionResponse>>("/project/tasks/toggle-completion", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to toggle task completion');
  }
  return response.data.data;
}
