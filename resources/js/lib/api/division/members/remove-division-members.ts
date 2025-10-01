import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { RemoveDivisionMemberRequest } from "@/types/division/members/division-members";

export async function removeDivisionMember(data: RemoveDivisionMemberRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/division/members/remove", data);
  if (!response.data.status) throw new Error(response.data.message);
}