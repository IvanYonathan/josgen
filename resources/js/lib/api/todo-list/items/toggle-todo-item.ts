import { AxiosJosgen } from "@/lib/axios/axios-josgen";
import { ApiResponse } from "@/types/api/response";
import { TodoItem } from "@/types/todo-list/todo-list";

export interface ToggleTodoItemRequest {
  id?: number;
  ids?: number[];
  completed?: boolean;
}

interface ToggleTodoItemSingleResponse {
  todo_item: TodoItem;
}

interface ToggleTodoItemBulkResponse {
  todo_items: TodoItem[];
}

export async function toggleTodoItem(data: ToggleTodoItemRequest): Promise<TodoItem | TodoItem[]> {
  const response = await AxiosJosgen.post<ApiResponse<ToggleTodoItemSingleResponse | ToggleTodoItemBulkResponse>>(
    "/todo-list/items/toggle",
    data
  );

  if (!response.data.status) throw new Error(response.data.message);

  if ('todo_item' in response.data.data) {
    return response.data.data.todo_item;
  } else {
    return response.data.data.todo_items;
  }
}