// Treasury Types

export interface TreasuryRequestApproval {
  id: number;
  treasury_request_id: number;
  user_id: number;
  decision: 'approved' | 'rejected';
  approval_level: 'leader' | 'treasurer';
  notes: string | null;
  created_at: string;
  updated_at: string;
  approver?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface TreasuryRequestItem {
  id: number;
  treasury_request_id: number;
  description: string;
  amount: number;
  category: string;
  item_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreasuryAttachment {
  id: number;
  treasury_request_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface TreasuryRequest {
  id: number;
  type: 'fund_request' | 'reimbursement';
  title: string;
  description: string;
  amount: number;
  currency: string;
  request_date: string;
  needed_by_date: string | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  requested_by: number;
  division_id: number | null;
  project_id: number | null;
  event_id: number | null;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  processed_by: number | null;
  created_at: string;
  updated_at: string;

  // Attachment (single, stored directly on request)
  attachment_filename: string | null;
  attachment_original_name: string | null;
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_size: number | null;

  // Computed
  approval_stage?: 'pending_leader' | 'pending_treasurer' | 'approved' | 'rejected';
  items_count?: number;

  // Relations
  requester?: {
    id: number;
    name: string;
    email?: string;
  };
  division?: {
    id: number;
    name: string;
  };
  project?: {
    id: number;
    name: string;
  };
  event?: {
    id: number;
    title: string;
  };
  items?: TreasuryRequestItem[];
  approvals?: TreasuryRequestApproval[];
}

export interface TreasuryStats {
  summary: {
    total_income: number;
    total_expenses: number;
    current_balance: number;
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    total_approved_amount: number;
    total_pending_amount: number;
  };
  chart_data: {
    month: string;
    month_number: number;
    income: number;
    expense: number;
  }[];
  category_breakdown: {
    category: string;
    label: string;
    total_amount: number;
    count: number;
  }[];
  income_category_breakdown: {
    category: string;
    label: string;
    total_amount: number;
    count: number;
  }[];
  pending_approval: TreasuryRequest[];
  categories: Record<string, string>;
  year: number;
}

export const expense_categories: Record<string, string> = {
  transportation: 'Transportation',
  food: 'Food & Beverages',
  supplies: 'Supplies & Materials',
  equipment: 'Equipment',
  venue: 'Venue & Rental',
  printing: 'Printing & Stationery',
  communication: 'Communication',
  utilities: 'Utilities',
  maintenance: 'Maintenance',
  other: 'Other',
};
