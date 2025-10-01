import { PaginatedResponse } from "../api/response";

export interface EventListResponse {
  events: Event[];
  pagination?: PaginatedResponse;
}

export interface EventResponse {
  event: Event;
}

export interface ListEventsRequest {
  division_id?: number;
  page?: number;
  per_page?: number;
}

export interface GetEventRequest {
  id: number;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  division_id?: number;
}

export interface UpdateEventRequest {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  division_id?: number;
}

export interface DeleteEventRequest {
  id: number;
}