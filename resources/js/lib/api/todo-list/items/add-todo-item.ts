import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { AddTodoItemRequest, TodoItemResponse } from "@/types/todo-list/todo-list";

export async function addTodoItem(data: AddTodoItemRequest): Promise<TodoItemResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoItemResponse>>("/todo-list/items/add", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}