import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryStats } from "@/types/treasury/treasury";

export interface TreasuryStatsParams {
    year?: number;
    month?: number;
}

export async function getTreasuryStats(params?: TreasuryStatsParams): Promise<TreasuryStats> {
    const response = await AxiosJosgen.post<ApiResponse<TreasuryStats>>('/treasury/stats', params);
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
