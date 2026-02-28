import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoListResponse } from "@/types/todo-list/todo-list";

export interface CreateTodoListRequest {
  title: string;
  type: 'personal' | 'division';
  division_id?: number;
}

export async function createTodoList(data: CreateTodoListRequest): Promise<TodoListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoListResponse>>("/todo-list/create", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}