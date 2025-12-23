import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project, ProjectStatus } from '@/types/project/project';

export interface UpdateProjectRequest {
  id: number;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  division_ids?: number[];
  member_ids?: number[];
}

export interface UpdateProjectResponse {
  project: Project;
}

export async function updateProject(data: UpdateProjectRequest): Promise<UpdateProjectResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UpdateProjectResponse>>("/project/update", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to update project');
  }
  return response.data.data;
}
