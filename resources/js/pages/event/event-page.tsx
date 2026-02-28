import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/contexts/auth-context';
import { EventManagementProvider, useEventManagementStore } from './store/event-management-store';
import { CreateEventSheet } from './components/create-event-sheet';
import { EditEventSheet } from './components/edit-event-sheet';
import { listEvents } from '@/lib/api/event/list-events';
import { Event } from '@/types/event/event';
import { useToast } from '@/hooks/use-toast';
import { EventCard } from './components/event-card';

function EventPageContent() {
  const { toast } = useToast();
  const { t } = useTranslation('event');
  const { permissions } = useAuth();
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
    setPagination({ page: 1 });
  }, [debouncedSearch, filters.statusFilter]);

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
          search: debouncedSearch || undefined,
          status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
        },
      });

      setEvents(response.events);
      setPagination({
        total: response.pagination.total,
        hasNextPage: response.pagination.has_next_page,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('failed_to_load_events');
      setError(errorMessage);
      toast.error(err, { title: t('failed_to_load_events') });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    if (event.can_edit) {
      openEditMode(event);
    } else {
      toast.warning({ title: t('view_only') });
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
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {permissions.can_create_events && (
          <Button onClick={openCreateMode}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('create_event')}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:flex-[10]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_events_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
            <SelectValue placeholder={t('all_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_status')}</SelectItem>
            <SelectItem value="upcoming">{t('upcoming')}</SelectItem>
            <SelectItem value="ongoing">{t('ongoing')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 sm:flex-[10]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_events_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
            <SelectValue placeholder={t('all_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_status')}</SelectItem>
            <SelectItem value="upcoming">{t('upcoming')}</SelectItem>
            <SelectItem value="ongoing">{t('ongoing')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
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
              ? t('noEventsFoundMatchingFilters')
              : t('noEventsFound')}
          </p>
          {permissions.can_create_events && (
            <Button variant="outline" onClick={openCreateMode}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('create_first_event')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={handleEventClick}
              />
            ))}
          </div>

          
          {pagination.total && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('showing_events', { shown: events.length, total: pagination.total })}
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
