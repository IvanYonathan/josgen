import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoListListResponse } from "@/types/todo-list/todo-list";

export interface ListTodoListsRequest {
  type?: 'personal' | 'division';
  division_id?: number;
  page?: number;
  limit?: number;
  filters?: {
    search?: string;
  };
  sort?: {
    [key: string]: 'asc' | 'desc';
  };
}

export async function listTodoLists(data: ListTodoListsRequest = {}): Promise<TodoListListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoListListResponse>>("/todo-list/list", data);
  if (!response.data.status) throw new Error(response.data.message);
  return response.data.data;
}