import { TodoItem, TodoList } from "..";
import { PaginatedResponse } from "../api/response";

export interface ListTodoListsRequest {
  type?: 'personal' | 'division';
  division_id?: number;
  page?: number;
  per_page?: number;
}

export interface GetTodoListRequest {
  id: number;
}

export interface CreateTodoListRequest {
  title: string;
  type: 'personal' | 'division';
  division_id?: number;
}

export interface UpdateTodoListRequest {
  id: number;
  title: string;
}

export interface DeleteTodoListRequest {
  id: number;
}

export interface TodoListItemsRequest {
  todo_list_id: number;
}

export interface AddTodoItemRequest {
  todo_list_id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number;
}

export interface UpdateTodoItemRequest {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number;
}

export interface DeleteTodoItemRequest {
  id: number;
}

export interface ToggleTodoItemRequest {
  id: number;
}

export interface TodoListListResponse {
  todo_lists: TodoList[];
  pagination?: PaginatedResponse;
}

export interface TodoListResponse {
  todo_list: TodoList;
}

export interface TodoItemsResponse {
  items: TodoItem[];
}

export interface TodoItemResponse {
  item: TodoItem;
}