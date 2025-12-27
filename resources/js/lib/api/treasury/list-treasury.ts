import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest } from "@/types/treasury/treasury";

export interface ListTreasuryParams {
    type?: 'fund_request' | 'reimbursement';
    status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
    per_page?: number;
}

export interface TreasuryPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface TreasuryListResponse {
    requests: TreasuryRequest[];
    pagination: TreasuryPagination;
}

export async function listTreasury(params?: ListTreasuryParams): Promise<TreasuryListResponse> {
    const response = await AxiosJosgen.post<ApiResponse<TreasuryListResponse>>('/treasury/list', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
