import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DivisionMembersRequest, DivisionMembersResponse } from "@/types/division/members/division-members";

export async function listDivisionMembers(data: DivisionMembersRequest): Promise<DivisionMembersResponse> {
  const response = await AxiosJosgen.post<ApiResponse<DivisionMembersResponse>>("/division/members/list", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}