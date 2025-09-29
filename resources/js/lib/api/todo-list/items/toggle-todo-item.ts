// import { AxiosJosgen } from "@/lib/axios/axios-josgen";
// import { ApiResponse } from "@/types/api/response";
// import { TodoItemResponse, ToggleTodoItemRequest } from "@/types/todo-list/todo-list";

// export async function toggleTodoItem(data: ToggleTodoItemRequest): Promise<TodoItemResponse> {
//   const response = await AxiosJosgen.post<ApiResponse<TodoItemResponse>>("/todo-list/items/toggle", data);
//   if (!response.data.success) throw new Error(response.data.message);
//   return response.data.data;
// }


// TODO(IvanYonathan) : Discuss, ini rencananya buat toggle status todo item (complete <-> incomplete)