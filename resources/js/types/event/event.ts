export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer_id: number;
  created_at: string;
  updated_at: string;

  // Relationships
  organizer?: {
    id: number;
    name: string;
  };
  divisions?: Division[];
  participants?: Participant[];

  can_edit?: boolean;
  can_modify_participants?: boolean;
  participants_count?: number;
}

export interface Division {
  id: number;
  name: string;
}

export interface Participant {
  id: number;
  name: string;
}