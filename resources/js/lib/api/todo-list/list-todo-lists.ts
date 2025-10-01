import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { ListTodoListsRequest, TodoListListResponse } from "@/types/todo-list/todo-list";

export async function listTodoLists(data: ListTodoListsRequest = {}): Promise<TodoListListResponse> {
  const response = await AxiosJosgen.post<ApiResponse<TodoListListResponse>>("/todo-list/list", data);
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}