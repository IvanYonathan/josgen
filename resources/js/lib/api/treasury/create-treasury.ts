import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest } from "@/types/treasury/treasury";

export interface CreateTreasuryItemInput {
    description: string;
    amount: number;
    category: string;
    item_date?: string;
}

export interface CreateTreasuryParams {
    type: 'fund_request' | 'reimbursement';
    title: string;
    description: string;
    amount: number;
    currency?: string;
    request_date: string;
    needed_by_date?: string;
    division_id?: number;
    project_id?: number;
    event_id?: number;
    items?: CreateTreasuryItemInput[];
    submit?: boolean; // If true, submit immediately instead of saving as draft
}

export interface CreateTreasuryResponse {
    request: TreasuryRequest;
}

export async function createTreasury(params: CreateTreasuryParams): Promise<CreateTreasuryResponse> {
    const response = await AxiosJosgen.post<ApiResponse<CreateTreasuryResponse>>('/treasury/create', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
