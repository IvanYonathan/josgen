import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest } from "@/types/treasury/treasury";

export interface ApproveTreasuryParams {
    id: number;
    notes?: string;
}

export interface ApproveTreasuryResponse {
    request: TreasuryRequest;
    approval_stage: string;
}

export async function approveTreasury(params: ApproveTreasuryParams): Promise<ApproveTreasuryResponse> {
    const response = await AxiosJosgen.post<ApiResponse<ApproveTreasuryResponse>>('/treasury/approve', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}

export interface RejectTreasuryParams {
    id: number;
    notes: string; // Required for rejection
}

export interface RejectTreasuryResponse {
    request: TreasuryRequest;
    approval_stage: string;
}

export async function rejectTreasury(params: RejectTreasuryParams): Promise<RejectTreasuryResponse> {
    const response = await AxiosJosgen.post<ApiResponse<RejectTreasuryResponse>>('/treasury/reject', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
