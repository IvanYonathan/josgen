import { User } from "@/types/user/user";

export interface DivisionMembersResponse {
  members: User[];
  available_users: User[];
}

export interface DivisionMembersRequest {
  division_id: number;
}

export interface AddDivisionMemberRequest {
  division_id: number;
  user_id: number;
}

export interface RemoveDivisionMemberRequest {
  division_id: number;
  user_id: number;
}