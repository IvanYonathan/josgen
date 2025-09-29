
export interface ListProjectsRequest {
  division_id?: number;
  page?: number;
  per_page?: number;
}

export interface GetProjectRequest {
  id: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  division_id?: number;
}

export interface UpdateProjectRequest {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  division_id?: number;
}

export interface DeleteProjectRequest {
  id: number;
}