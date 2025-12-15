import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CalendarDays, MapPin, Users, Building2, AlertCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { UpdateEventFormData, updateEventSchema, cleanEventFormData } from '../schemas/event-schemas';
import { updateEvent } from '@/lib/api/event/update-event';
import { deleteEvent } from '@/lib/api/event/delete-event';
import { useEventManagementStore } from '../store/event-management-store';
import { toast } from 'sonner';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { listUsers } from '@/lib/api/user/list-users';
import { Event } from '@/types/event/event';
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectEmpty, MultiSelectGroup, MultiSelectItem } from '@/components/ui/multi-select';
import { ParticipantSelector } from './participant-selector';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EventUnsavedChangesDialog } from './event-unsaved-changes-dialog';

export function EditEventSheet() {
  const { closeEditMode, selectedEvent, updateEventInList, removeEvent: removeEventFromList } = useEventManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [divisions, setDivisions] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!selectedEvent) {
    closeEditMode();
    return null;
  }

  const form = useForm({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      id: selectedEvent.id,
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      start_date: selectedEvent.start_date ? selectedEvent.start_date.slice(0, 16) : '',
      end_date: selectedEvent.end_date ? selectedEvent.end_date.slice(0, 16) : '',
      location: selectedEvent.location || '',
      division_ids: selectedEvent.divisions?.map(d => d.id) || [],
      participant_ids: selectedEvent.participants?.map(p => p.id) || [],
    },
    mode: 'onChange',
  });

  const watchedFields = form.watch();

  useEffect(() => {
    if (!hasUnsavedChanges) {
      const changed =
        watchedFields.title !== selectedEvent.title ||
        watchedFields.description !== (selectedEvent.description || '') ||
        watchedFields.location !== (selectedEvent.location || '');
      if (changed) {
        setHasUnsavedChanges(true);
      }
    }
  }, [watchedFields, hasUnsavedChanges, selectedEvent]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [divisionsRes, usersRes] = await Promise.all([
          listDivisions(),
          listUsers(),
        ]);
        setDivisions(divisionsRes.divisions || []);
        setUsers(usersRes.users || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load divisions and users');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      closeEditMode();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedDialog(false);
    closeEditMode();
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const cleanedData = cleanEventFormData(data);
      const response = await updateEvent(cleanedData as UpdateEventFormData);
      updateEventInList(response.event);
      toast.success('Event updated successfully');
      closeEditMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
      console.error('Failed to update event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent({ id: selectedEvent.id });
      removeEventFromList(selectedEvent.id);
      toast.success('Event deleted successfully');
      setShowDeleteDialog(false);
      closeEditMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
      console.error('Failed to delete event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canModifyParticipants = selectedEvent.can_modify_participants && selectedEvent.status === 'upcoming';

  return (
    <div className="p-6">
      <div className="flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              disabled={isSubmitting || isDeleting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Edit Event</h1>
                <Badge className={getStatusColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Update event details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedEvent.can_edit && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || isDeleting || loadingData || !selectedEvent.can_edit}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
            {!selectedEvent.can_edit && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">You do not have permission to edit this event</p>
                </div>
              </div>
            )}

            {!canModifyParticipants && selectedEvent.status !== 'upcoming' && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Participants cannot be modified because the event is {selectedEvent.status}
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Enter event title"
                  className="text-lg"
                  disabled={isSubmitting || !selectedEvent.can_edit}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Enter event description"
                  rows={4}
                  disabled={isSubmitting || !selectedEvent.can_edit}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    {...form.register('start_date')}
                    disabled={isSubmitting || !selectedEvent.can_edit}
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    End Date *
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    {...form.register('end_date')}
                    disabled={isSubmitting || !selectedEvent.can_edit}
                  />
                  {form.formState.errors.end_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  placeholder="Enter event location"
                  disabled={isSubmitting || !selectedEvent.can_edit}
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="division_ids">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Assigned Divisions *
                </Label>
                <Controller
                  name="division_ids"
                  control={form.control}
                  render={({ field }) => (
                    <MultiSelect
                      value={field.value?.map(String) || []}
                      onValueChange={(values) => field.onChange(values.map(Number))}
                    >
                      <MultiSelectTrigger>
                        <MultiSelectValue
                          placeholder="Select divisions..."
                          itemComponent={(props) => (
                            <Badge variant="secondary" className="mr-1">
                              {divisions.find(d => d.id === Number(props.value))?.name || props.value}
                            </Badge>
                          )}
                        />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectEmpty>No divisions found</MultiSelectEmpty>
                        <MultiSelectGroup>
                          {divisions.map((division) => (
                            <MultiSelectItem key={division.id} value={String(division.id)}>
                              {division.name}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                  )}
                />
                {form.formState.errors.division_ids && (
                  <p className="text-sm text-destructive">{form.formState.errors.division_ids.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <Users className="h-4 w-4 inline mr-1" />
                  Participants ({form.watch('participant_ids')?.length || 0})
                </Label>

                {canModifyParticipants ? (
                  <Controller
                    name="participant_ids"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {field.value && field.value.length > 0 && (
                          <div className="rounded-md border p-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              Selected: {field.value.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}

                        <ParticipantSelector
                          users={users}
                          value={field.value || []}
                          onChange={field.onChange}
                          disabled={isSubmitting || loadingData || !selectedEvent.can_edit}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <div className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current participants: {selectedEvent.participants?.map(p => p.name).join(', ') || 'None'}
                    </p>
                    <p className="text-xs text-blue-800">
                      Participants are locked because the event is not in 'upcoming' status
                    </p>
                  </div>
                )}

                {form.formState.errors.participant_ids && (
                  <p className="text-sm text-destructive">{form.formState.errors.participant_ids.message}</p>
                )}
              </div>
            </form>
          </div>

          <DeleteConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={handleDelete}
            title="Delete Event"
            description={`Are you sure you want to delete "${selectedEvent.title}"? This action cannot be undone.`}
            isLoading={isDeleting}
          />

          <EventUnsavedChangesDialog
            open={showUnsavedDialog}
            onOpenChange={setShowUnsavedDialog}
            onConfirm={handleConfirmDiscard}
          />
      </div>
    </div>
  );
}
