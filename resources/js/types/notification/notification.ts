export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationData {
  kind: string;
  level: NotificationLevel;
  title: string;
  body?: string;
  action_url?: string;
  meta?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

