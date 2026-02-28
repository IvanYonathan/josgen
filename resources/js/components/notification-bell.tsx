import { listNotifications } from '@/lib/api/notification/list-notifications';
import { markAllNotificationsRead } from '@/lib/api/notification/mark-all-notifications-read';
import { markNotificationsRead } from '@/lib/api/notification/mark-notifications-read';
import { AppNotification, NotificationLevel } from '@/types/notification/notification';
import { formatDate } from '@/utils/date';
import { Bell } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function toastVariant(level: NotificationLevel): 'success' | 'warning' | 'error' {
  if (level === 'warning') return 'warning';
  if (level === 'error') return 'error';
  return 'success';
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const knownIdsRef = React.useRef<Set<string>>(new Set());
  const hasBootstrappedRef = React.useRef(false);
  const pollingRef = React.useRef<number | null>(null);

  const refresh = React.useCallback(
    async (opts?: { toastNew?: boolean }) => {
      const { notifications: nextNotifications, unread_count } = await listNotifications({ limit: 20 });

      const toastNew = opts?.toastNew ?? false;
      if (toastNew && hasBootstrappedRef.current) {
        const newOnes = nextNotifications.filter((n) => !knownIdsRef.current.has(n.id));
        for (const n of newOnes.slice(0, 3)) {
          const variant = toastVariant(n.data.level);
          toast[variant]({
            itemID: n.id,
            title: n.data.title,
            description: n.data.body ?? undefined,
            duration: 3500,
          });
        }
      }

      for (const n of nextNotifications) {
        knownIdsRef.current.add(n.id);
      }

      setNotifications(nextNotifications);
      setUnreadCount(unread_count);
      hasBootstrappedRef.current = true;
    },
    [toast]
  );

  React.useEffect(() => {
    refresh({ toastNew: false });

    pollingRef.current = window.setInterval(() => {
      refresh({ toastNew: true }).catch(() => {
        // ignore poll errors (e.g. expired token)
      });
    }, 20000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, [refresh]);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        refresh({ toastNew: false }).catch(() => {
          // ignore
        });
      }
    },
    [refresh]
  );

  const openNotification = React.useCallback(
    async (n: AppNotification) => {
      if (!n.read_at) {
        try {
          const result = await markNotificationsRead({ id: n.id });
          setUnreadCount(result.unread_count);
        } catch {
          // ignore
        }
      }

      if (n.data.action_url) {
        navigate(n.data.action_url);
      }
    },
    [navigate]
  );

  const markAllRead = React.useCallback(async () => {
    const result = await markAllNotificationsRead();
    setUnreadCount(result.unread_count);
    await refresh({ toastNew: false });
  }, [refresh]);

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1">
              <Badge size="sm" className="min-w-5 justify-center px-1 py-0.5 text-[10px] leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>

        <div className="max-h-[420px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className="hover:bg-accent/50 flex w-full flex-col gap-1 px-3 py-2 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{n.data.title}</div>
                    {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.data.body && <div className="text-xs text-muted-foreground">{n.data.body}</div>}
                  <div className="text-[11px] text-muted-foreground">{formatDate(n.created_at)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

