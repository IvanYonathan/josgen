import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CalendarDays, MapPin, Users, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { CreateEventFormData, createEventSchema, cleanEventFormData } from '../schemas/event-schemas';
import { createEvent } from '@/lib/api/event/create-event';
import { useEventManagementStore } from '../store/event-management-store';
import { toast } from 'sonner';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { listUsers } from '@/lib/api/user/list-users';
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectEmpty, MultiSelectGroup, MultiSelectItem } from '@/components/ui/multi-select';
import { ParticipantSelector } from './participant-selector';
import { EventUnsavedChangesDialog } from './event-unsaved-changes-dialog';

export function CreateEventSheet() {
  const { closeCreateMode, addEvent } = useEventManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [divisions, setDivisions] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      division_ids: [],
      participant_ids: [] as number[],
    },
    mode: 'onChange',
  });

  const watchedFields = form.watch();

  useEffect(() => {
    if (!hasUnsavedChanges && (
      watchedFields.title ||
      watchedFields.description ||
      watchedFields.start_date ||
      watchedFields.end_date ||
      watchedFields.location
    )) {
      setHasUnsavedChanges(true);
    }
  }, [watchedFields, hasUnsavedChanges]);

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
      closeCreateMode();
    }
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedDialog(false);
    closeCreateMode();
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const cleanedData = cleanEventFormData(data);
      const response = await createEvent(cleanedData as CreateEventFormData);
      addEvent(response.event);
      toast.success('Event created successfully');
      closeCreateMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Event</h1>
              <p className="text-sm text-muted-foreground">Create a new event for your division</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || loadingData}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Enter event title"
                  className="text-lg"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                <Label htmlFor="participant_ids">
                  <Users className="h-4 w-4 inline mr-1" />
                  Participants (Optional)
                </Label>
                <Controller
                  name="participant_ids"
                  control={form.control}
                  render={({ field }) => (
                    <ParticipantSelector
                      users={users}
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={isSubmitting || loadingData}
                    />
                  )}
                />
                {form.formState.errors.participant_ids && (
                  <p className="text-sm text-destructive">{form.formState.errors.participant_ids.message}</p>
                )}
              </div>
            </form>
        </div>
      </div>

      <EventUnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
