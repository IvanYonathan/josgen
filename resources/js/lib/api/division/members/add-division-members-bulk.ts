import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export interface BulkAddDivisionMembersRequest {
  division_id: number;
  user_ids: number[];
}

export async function addDivisionMembersBulk(data: BulkAddDivisionMembersRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/division/members/add-bulk", data);
  if (!response.data.status) throw new Error(response.data.message);
}