import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { DeleteTodoItemRequest } from "@/types/todo-list/todo-list";

export async function deleteTodoItem(data: DeleteTodoItemRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/todo-list/items/delete", data);
  if (!response.data.success) throw new Error(response.data.message);
}