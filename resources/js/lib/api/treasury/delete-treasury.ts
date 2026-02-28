import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export async function deleteTreasury(id: number): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse<null>>('/treasury/delete', { id });
  if (!response.data.status) throw new Error(response.data.message);
}
