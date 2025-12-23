import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project } from '@/types/project/project';

export interface AddMembersRequest {
  project_id: number;
  user_ids: number[];
}

export interface AddMembersResponse {
  project: Project;
}

export async function addMembers(data: AddMembersRequest): Promise<AddMembersResponse> {
  const response = await AxiosJosgen.post<ApiResponse<AddMembersResponse>>("/project/members/add", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to add members');
  }
  return response.data.data;
}
