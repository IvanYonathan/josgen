import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest, expense_categories } from "@/types/treasury/treasury";

export interface TreasuryGetResponse {
  request: TreasuryRequest;
  categories: Record<string, string>;
}

export async function getTreasury(id: number): Promise<TreasuryGetResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TreasuryGetResponse>>('/treasury/get', { id });
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}
