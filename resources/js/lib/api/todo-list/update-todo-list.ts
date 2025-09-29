import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoListResponse, UpdateTodoListRequest } from "@/types/todo-list/todo-list";

export async function updateTodoList(data: UpdateTodoListRequest): Promise<TodoListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoListResponse>>("/todo-list/update", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}