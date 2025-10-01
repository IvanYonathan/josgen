import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DeleteDivisionRequest } from "@/types/division/division";

export async function deleteDivision(data: DeleteDivisionRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/division/delete", data);
  if (!response.data.status) throw new Error(response.data.message);
}