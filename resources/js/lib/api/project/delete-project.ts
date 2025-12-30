import { AxiosJosgen } from '@/lib/axios/axios-josgen';
import { ApiResponse } from '@/types/api/response';

export interface DeleteProjectRequest {
  id: number;
}

export async function deleteProject(data: DeleteProjectRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse<null>>("/project/delete", data);
  if (!response.data.status) {
    throw new Error(response.data.message || 'Failed to delete project');
  }
}
