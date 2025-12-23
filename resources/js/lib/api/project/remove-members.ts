import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';
import { Project } from '@/types/project/project';

export interface RemoveMembersRequest {
  project_id: number;
  user_ids: number[];
}

export interface RemoveMembersResponse {
  project: Project;
}

export async function removeMembers(data: RemoveMembersRequest): Promise<RemoveMembersResponse> {
  const response = await AxiosJosgen.post<ApiResponse<RemoveMembersResponse>>("/project/members/remove", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to remove members');
  }
  return response.data.data;
}
