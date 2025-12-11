import { useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, MapPin, Users, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { EventManagementProvider, useEventManagementStore } from './store/event-management-store';
import { CreateEventSheet } from './components/create-event-sheet';
import { EditEventSheet } from './components/edit-event-sheet';
import { listEvents } from '@/lib/api/event/list-events';
import { Event } from '@/types/event/event';
import { toast } from 'sonner';
import { formatDate } from '@/utils/date';

function EventPageContent() {
  const { t } = useTranslation('event');
  const {
    events,
    loading,
    error,
    setEvents,
    setLoading,
    setError,
    createMode,
    editMode,
    openCreateMode,
    openEditMode,
    searchInput,
    setSearchInput,
    setSearchTerm,
    filters,
    setStatusFilter,
    pagination,
    setPagination,
  } = useEventManagementStore();

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    loadEvents();
  }, [debouncedSearch, filters.statusFilter, pagination.page]);

  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listEvents({
        page: pagination.page,
        limit: pagination.limit,
        filters: {
          search: filters.searchTerm,
          status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
        },
      });

      setEvents(response.events);
      setPagination({
        total: response.pagination.total,
        hasNextPage: response.pagination.has_next_page,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEventClick = (event: Event) => {
    if (event.can_edit) {
      openEditMode(event);
    } else {
      toast.info('You can only view this event');
    }
  };

  if (createMode) {
    return <CreateEventSheet />;
  }

  if (editMode) {
    return <EditEventSheet />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
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

        <Button onClick={openCreateMode}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:flex-[10]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:text-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {filters.searchTerm || filters.statusFilter !== 'all'
              ? 'No events found matching your filters'
              : 'No events found'}
          </p>
          <Button variant="outline" onClick={openCreateMode}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first event
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="hover:text-primary transition-colors line-clamp-2 flex-1">
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
                      <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Start:</span>
                        <span>{formatDate(event.start_date, { format: 'MMM DD, YYYY hh:mm A' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">End:</span>
                        <span>{formatDate(event.end_date, { format: 'MMM DD, YYYY hh:mm A' })}</span>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{event.participants_count || 0} participants</span>
                    </div>

                    {event.divisions && event.divisions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.divisions.map((division) => (
                          <Badge key={division.id} variant="outline" className="text-xs">
                            {division.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    {event.can_edit ? 'Edit Event' : 'View Details'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          
          {pagination.total && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {events.length} of {pagination.total} events
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const EventPage = EventManagementProvider(EventPageContent);
export default EventPage;
