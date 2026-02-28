import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest } from "@/types/treasury/treasury";

export interface UpdateTreasuryItemInput {
  id?: number;
  description: string;
  amount: number;
  category: string;
  item_date?: string;
}

export interface UpdateTreasuryParams {
  id: number;
  type?: 'fund_request' | 'reimbursement';
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  request_date?: string;
  needed_by_date?: string;
  division_id?: number;
  project_id?: number;
  event_id?: number;
  items?: UpdateTreasuryItemInput[];
}

export interface UpdateTreasuryResponse {
  request: TreasuryRequest;
}

export async function updateTreasury(params: UpdateTreasuryParams): Promise<UpdateTreasuryResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UpdateTreasuryResponse>>('/treasury/update', params);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}
