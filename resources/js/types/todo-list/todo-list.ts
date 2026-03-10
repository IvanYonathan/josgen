
import { PaginatedResponse } from "../api/response";
import { Division } from "../division/division";
import { User } from "../user/user";

export interface TodoList {
  id: number;
  title: string;
  type: 'personal' | 'division';
  user_id: number;
  user?: User;
  division_id: number | null;
  division?: Division;
  created_at: string;
  updated_at: string;
  items?: TodoItem[];
  total_items?: number;
  completed_items?: number;
}

export interface TodoItem {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string;
  todo_list_id: number;
  assigned_to: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface TodoListPagination {
  page: number;
  limit: number;
  total: number;
  has_next_page: boolean;
}

export interface TodoListResponse {
  todo_list: TodoList;
}

export interface TodoListListResponse {
  todo_lists: TodoList[];
  pagination?: TodoListPagination;
}

export interface TodoItemsResponse {
  todo_items: TodoItem[];
}

export interface TodoItemResponse {
  todo_item: TodoItem;
}