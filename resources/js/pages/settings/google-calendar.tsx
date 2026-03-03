import { useEffect, useState } from 'react';
import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SettingsLayout from '@/layouts/settings/layout';
import { fetchGoogleCalendarStatus } from '@/lib/api/google-calendar/status';
import { connectGoogleCalendar } from '@/lib/api/google-calendar/connect';
import { disconnectGoogleCalendar } from '@/lib/api/google-calendar/disconnect';
import { GoogleCalendarStatus } from '@/types/google-calendar/google-calendar';
import { toast } from 'sonner';

export default function GoogleCalendarSettings() {
    const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        document.title = 'Google Calendar settings';

        // Handle OAuth redirect query params
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            toast.success('Google Calendar connected successfully! Your items are being synced.');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('error')) {
            const error = params.get('error');
            const messages: Record<string, string> = {
                access_denied: 'You denied access to Google Calendar.',
                missing_params: 'Invalid callback parameters.',
                auth_failed: 'Authentication failed. Please try again.',
            };
            toast.error(messages[error!] || 'Failed to connect Google Calendar.');
            window.history.replaceState({}, '', window.location.pathname);
        }

        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const data = await fetchGoogleCalendarStatus();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch Google Calendar status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setProcessing(true);
        try {
            const data = await connectGoogleCalendar();
            window.location.href = data.auth_url;
        } catch (err) {
            console.error('Failed to initiate Google Calendar connection:', err);
            toast.error('Failed to initiate connection. Please try again.');
            setProcessing(false);
        }
    };

    const handleDisconnect = async () => {
        setProcessing(true);
        try {
            await disconnectGoogleCalendar();
            setStatus({ connected: false, google_email: null, connected_at: null, synced_events_count: 0 });
            toast.success('Google Calendar disconnected successfully.');
        } catch (err) {
            console.error('Failed to disconnect Google Calendar:', err);
            toast.error('Failed to disconnect. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Google Calendar" description="Manage your Google Calendar integration" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </SettingsLayout>
        );
    }

    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Google Calendar" description="Sync your events, projects, tasks, and to-do items to Google Calendar" />

                {status?.connected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 text-white">Connected</Badge>
                            {status.google_email && (
                                <span className="text-muted-foreground text-sm">{status.google_email}</span>
                            )}
                        </div>

                        <div className="text-sm space-y-1">
                            <p>
                                <span className="text-muted-foreground">Synced items: </span>
                                <span className="font-medium">{status.synced_events_count}</span>
                            </p>
                            {status.connected_at && (
                                <p>
                                    <span className="text-muted-foreground">Connected since: </span>
                                    <span className="font-medium">
                                        {new Date(status.connected_at).toLocaleDateString()}
                                    </span>
                                </p>
                            )}
                        </div>

                        <p className="text-muted-foreground text-sm">
                            Your events, projects, tasks, and to-do items with dates are automatically synced to your Google Calendar.
                        </p>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={processing}>
                                    Disconnect
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will remove all JosGen-created events from your Google Calendar and revoke access. You can reconnect at any time.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDisconnect} disabled={processing}>
                                        Disconnect
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Connect your Google account to automatically sync your events, projects, tasks, and to-do items to Google Calendar. Only calendar event access is requested.
                        </p>

                        <Button onClick={handleConnect} disabled={processing}>
                            {processing ? 'Connecting...' : 'Connect Google Calendar'}
                        </Button>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
}
