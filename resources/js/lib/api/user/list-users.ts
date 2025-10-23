import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { UserListResponse } from "@/types/user/user";

export type ListUsersSortDirection = "asc" | "desc";

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  filters?: Record<string, string | number | Array<string | number>>;
  sort?: Record<string, ListUsersSortDirection>;
}

export async function listUsers(payload: ListUsersRequest = {}): Promise<UserListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<UserListResponse>>(`/user/list`, payload);
  if (!response.data.status) throw new Error(response.data.message || "Failed to load users");
  const data = response.data.data ?? {};
  const users = Array.isArray((data as any).users) ? (data as any).users : [];
  const total =
    typeof response.data.total === "number"
      ? response.data.total
      : typeof (data as any).total === "number"
        ? (data as any).total
        : undefined;

  return {
    ...(data as object),
    users,
    total,
  } as UserListResponse;
}
