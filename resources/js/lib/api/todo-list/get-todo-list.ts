import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoListResponse } from "@/types/todo-list/todo-list";

export interface GetTodoListRequest {
  id: number;
}

export async function getTodoList(data: GetTodoListRequest): Promise<TodoListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoListResponse>>("/todo-list/get", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}