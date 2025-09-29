import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { CreateDivisionRequest, DivisionResponse } from "@/types/division/division";

export async function createDivision(data: CreateDivisionRequest): Promise<DivisionResponse> {
  const response = await AxiosJosgen.post<ApiResponse<DivisionResponse>>("/division/create", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}