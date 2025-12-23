import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project, Pagination, ProjectStatus } from '@/types/project/project';

export interface ListProjectsRequest {
  page?: number;
  limit?: number;
  filters?: {
    search?: string;
    status?: ProjectStatus;
    division_id?: number;
  };
  sort?: Record<string, 'asc' | 'desc'>;
}

export interface ListProjectsResponse {
  projects: Project[];
  pagination: Pagination;
}

export async function listProjects(data: ListProjectsRequest = {}): Promise<ListProjectsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<ListProjectsResponse>>("/project/list", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to fetch projects');
  }
  return response.data.data;
}
