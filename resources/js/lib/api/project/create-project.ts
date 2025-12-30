import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project } from '@/types/project/project';

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  division_ids: number[];
  member_ids?: number[];
}

export interface CreateProjectResponse {
  project: Project;
}

export async function createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
  const response = await AxiosJosgen.post<ApiResponse<CreateProjectResponse>>("/project/create", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to create project');
  }
  return response.data.data;
}
