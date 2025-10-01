import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoItemResponse, UpdateTodoItemRequest } from "@/types/todo-list/todo-list";

export async function updateTodoItem(data: UpdateTodoItemRequest): Promise<TodoItemResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoItemResponse>>("/todo-list/items/update", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}