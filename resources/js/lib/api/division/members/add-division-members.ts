import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { AddDivisionMemberRequest } from "@/types/division/members/division-members";

export async function addDivisionMember(data: AddDivisionMemberRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/division/members/add", data);
  if (!response.data.status) throw new Error(response.data.message);
}