import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";

export interface DeleteTodoListRequest {
  id: number;
}

export async function deleteTodoList(data: DeleteTodoListRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/todo-list/delete", data);
  if (!response.data.status) throw new Error(response.data.message);
}