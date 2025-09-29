import { User } from "../user/user";

export interface Division {
    id: number;
    name: string;
    description: string | null;
    leader_id: number | null;
    leader?: User;
    created_at: string;
    updated_at: string;
    members_count?: number;
    events_count?: number;
    projects_count?: number;
    todo_lists_count?: number;
}

export interface DivisionListResponse {
  divisions: Division[];
}

export interface CreateDivisionRequest {
  name: string;
  description?: string;
  leader_id?: number;
}

export interface GetDivisionRequest {
  id: number;
}

export interface UpdateDivisionRequest {
  id: number;
  name: string;
  description?: string;
  leader_id?: number;
}

export interface DeleteDivisionRequest {
  id: number;
}

export interface DivisionResponse {
  division: Division;
}