import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DivisionResponse, GetDivisionRequest } from "@/types/division/division";

export async function getDivision(data: GetDivisionRequest): Promise<DivisionResponse> {
  const response = await AxiosJosgen.post<ApiResponse<DivisionResponse>>("/division/get", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}