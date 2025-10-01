import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { DeleteTodoListRequest } from "@/types/todo-list/todo-list";

export async function deleteTodoList(data: DeleteTodoListRequest): Promise<void> {
  const response = await AxiosJosgen.post<ApiResponse>("/todo-list/delete", data);
  if (!response.data.success) throw new Error(response.data.message);
}