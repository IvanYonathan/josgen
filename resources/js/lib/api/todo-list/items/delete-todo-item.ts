import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";

export interface DeleteTodoItemRequest {
  id: number;
}

export async function deleteTodoItem(data: DeleteTodoItemRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/todo-list/items/delete", data);
  if (!response.data.status) throw new Error(response.data.message);
}