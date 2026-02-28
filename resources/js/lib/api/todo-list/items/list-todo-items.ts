import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoItemsResponse } from "@/types/todo-list/todo-list";

export interface TodoListItemsRequest {
  todo_list_id: number;
}

export async function listTodoItems(data: TodoListItemsRequest): Promise<TodoItemsResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoItemsResponse>>("/todo-list/items/list", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}