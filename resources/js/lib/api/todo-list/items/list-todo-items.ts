import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoItemsResponse, TodoListItemsRequest } from "@/types/todo-list/todo-list";

export async function listTodoItems(data: TodoListItemsRequest): Promise<TodoItemsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoItemsResponse>>("/todo-list/items/list", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}