import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { TreasuryRequest } from "@/types/treasury/treasury";

export interface SubmitTreasuryResponse {
    request: TreasuryRequest;
}

export async function submitTreasury(id: number): Promise<SubmitTreasuryResponse> {
    const response = await AxiosJosgen.post<ApiResponse<SubmitTreasuryResponse>>('/treasury/submit', { id });
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
