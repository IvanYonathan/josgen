import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoItemResponse } from "@/types/todo-list/todo-list";

export interface AddTodoItemRequest {
  todo_list_id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number;
}

export async function addTodoItem(data: AddTodoItemRequest): Promise<TodoItemResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoItemResponse>>("/todo-list/items/add", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}