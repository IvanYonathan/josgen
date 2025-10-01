// Base API Response structure following React+Golang pattern
export interface ApiResponse<T = any> {
  status: boolean;
  code: number;
  data: T;
  total?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

// Paginated response structure
export interface PaginatedResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Error response structure
export interface ApiErrorResponse {
  status: false;
  code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Success response structure
export interface ApiSuccessResponse<T = any> {
  status: true;
  code: number;
  data: T;
  total?: number;
}