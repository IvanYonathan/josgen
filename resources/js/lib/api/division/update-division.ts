import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DivisionResponse, UpdateDivisionRequest } from "@/types/division/division";

export async function updateDivision(data: UpdateDivisionRequest): Promise<DivisionResponse> {
  const response = await AxiosJosgen.post<ApiResponse<DivisionResponse>>("/division/update", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}