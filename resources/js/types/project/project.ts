import { Division } from '../division/division';
import { User } from '../user/user';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_to: number | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;

  assigned_user?: {
    id: number;
    name: string;
  };
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: ProjectStatus;
  progress: number;
  manager_id: number;
  created_at: string;
  updated_at: string;

  manager?: {
    id: number;
    name: string;
    email?: string;
  };
  divisions?: Division[];
  members?: User[];
  tasks?: ProjectTask[];

  can_edit?: boolean;
  can_modify_members?: boolean;
  members_count?: number;
  tasks_count?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  has_next_page: boolean;
}
