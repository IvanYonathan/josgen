import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project } from '@/types/project/project';

export interface GetProjectRequest {
  id: number;
}

export interface GetProjectResponse {
  project: Project;
}

export async function getProject(data: GetProjectRequest): Promise<GetProjectResponse> {
  const response = await AxiosJosgen.post<ApiResponse<GetProjectResponse>>("/project/get", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to fetch project');
  }
  return response.data.data;
}
