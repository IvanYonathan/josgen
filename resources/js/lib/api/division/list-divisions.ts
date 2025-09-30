import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DivisionListResponse } from "@/types/division/division";

export async function listDivisions(): Promise<{ divisions: DivisionListResponse[], total: number }> {
  const response = await AxiosJosgen.post<ApiResponse<DivisionListResponse[]>>("/division/list", {});
  if (!response.data.status) throw new Error(response.data.message || 'Failed to load divisions');
  return {
    divisions: response.data.data,
    total: response.data.total || response.data.data.length
  };
}