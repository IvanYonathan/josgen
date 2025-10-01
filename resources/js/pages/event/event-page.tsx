import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, MapPin, Users, Clock, PlusCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// Placeholder types - replace with actual API types
interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  participants_count: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface EventsResponse {
  events: Event[];
  total: number;
}

export default function EventPage() {
  const { t } = useTranslation('event');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from API
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when event API is implemented
      // const response = await listEvents();
      // setEvents(response.events);

      // Mock data for now
      const mockEvents: Event[] = [
        {
          id: 1,
          title: 'Team Building Workshop',
          description: 'Annual team building activities and workshop',
          date: '2024-05-15',
          location: 'Conference Room A',
          participants_count: 25,
          status: 'upcoming'
        },
        {
          id: 2,
          title: 'Project Kick-off Meeting',
          description: 'Initial meeting for the new project phase',
          date: '2024-05-10',
          location: 'Virtual Meeting',
          participants_count: 12,
          status: 'completed'
        }
      ];

      setEvents(mockEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Events</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No events found</p>
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.participants_count} participants</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* TODO: Add pagination when API supports it */}
      {events.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {events.length} events
          </p>
        </div>
      )}
    </div>
  );
}