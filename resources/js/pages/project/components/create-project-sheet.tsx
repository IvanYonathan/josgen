import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectItem } from '@/components/ui/multi-select';
import { Loader2, ArrowLeft, Save, Briefcase } from 'lucide-react';
import { useProjectManagementStore } from '../store/project-management-store';
import { createProject } from '@/lib/api/project/create-project';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { listUserOptions } from '@/lib/api/user/list-user-options';
import { createProjectSchema, cleanProjectFormData, type CreateProjectFormData } from '../schemas/project-schemas';
import { useToast } from '@/hooks/use-toast';
import { DivisionListResponse } from '@/types/division/division';
import { UserOption } from '@/types/user/user';
import { ProjectUnsavedChangesDialog } from './unsaved-changes-dialog';
import { useTranslation } from '@/hooks/use-translation';

export function CreateProjectSheet() {
  const { toast } = useToast();
  const { closeCreateMode, addProject } = useProjectManagementStore();
  const { t } = useTranslation('project');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      division_ids: [],
      member_ids: [],
    },
    mode: 'onChange',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [divisionsRes, usersRes] = await Promise.all([
          listDivisions(),
          listUserOptions(),
        ]);
        setDivisions(divisionsRes.divisions || []);
        setUsers(usersRes.users || []);
      } catch (error) {
        toast.error(error, { title: t('failed_to_load_divisions_and_users') });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const watchedFields = form.watch();
  useEffect(() => {
    if (!hasUnsavedChanges && (watchedFields.name || watchedFields.description)) {
      setHasUnsavedChanges(true);
    }
  }, [watchedFields]);

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
    const { id } = toast.loading({ title: 'Creating project...' });
    try {
      setIsSubmitting(true);
      const cleanedData = cleanProjectFormData(data);
      const response = await createProject(cleanedData);
      addProject(response.project);
      toast.success({ itemID: id, title: t('create_success') });
      closeCreateMode();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('create_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDivisionIds = form.watch('division_ids');
  const filteredUsers = users.filter((user) =>
    user.division_ids?.some((id) => selectedDivisionIds.includes(id)) ||
    (user.division_id && selectedDivisionIds.includes(user.division_id))
  );

  return (
    <div className="p-6">
      <div className="flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackClick} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('createProject.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('createProject.description')}</p>
            </div>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || loadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {t('createProject.button.create')}
          </Button>
        </div>

        <div className="max-w-4xl space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">{t('createProject.tabs.details')}</TabsTrigger>
              <TabsTrigger value="tasks" disabled>{t('createProject.tabs.tasks')}</TabsTrigger>
              </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t('createProject.form.name.label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="name" {...form.register('name')} placeholder={t('createProject.form.name.placeholder')} />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('createProject.form.description.label')}</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder={t('createProject.form.description.placeholder')}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">
                        {t('createProject.form.start_date.label')} <span className="text-destructive">*</span>
                      </Label>
                      <Input id="start_date" type="date" {...form.register('start_date')} />
                      {form.formState.errors.start_date && (
                        <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">{t('createProject.form.end_date.label')}</Label>
                      <Input id="end_date" type="date" {...form.register('end_date')} />
                      {form.formState.errors.end_date && (
                        <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {t('createProject.form.division_ids.label')} <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="division_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect value={field.value?.map(String) || []} onValueChange={(values) => field.onChange(values.map(Number))}>
                          <MultiSelectTrigger>
                            <MultiSelectValue placeholder={t('createProject.form.division_ids.placeholder')} />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            {divisions.map((division) => (
                              <MultiSelectItem key={division.id} value={String(division.id)}>
                                {division.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectContent>
                        </MultiSelect>
                      )}
                    />
                    {form.formState.errors.division_ids && (
                      <p className="text-sm text-destructive">{form.formState.errors.division_ids.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('createProject.form.member_ids.label')}</Label>
                    <p className="text-sm text-muted-foreground">{t('createProject.form.member_ids.description')}</p>
                    <Controller
                      name="member_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect value={field.value?.map(String) || []} onValueChange={(values) => field.onChange(values.map(Number))}>
                          <MultiSelectTrigger>
                            <MultiSelectValue
                              placeholder={selectedDivisionIds.length === 0
                                ? t('createProject.form.member_ids.placeholder_divisions_first')
                                : t('createProject.form.member_ids.placeholder_select')}
                            />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            {filteredUsers.length === 0 ? (
                              <div className="p-4 text-sm text-muted-foreground text-center">{t('createProject.form.member_ids.empty_users')}</div>
                            ) : (
                              filteredUsers.map((user) => (
                                <MultiSelectItem key={user.id} value={String(user.id)}>
                                  {user.name}
                                </MultiSelectItem>
                              ))
                            )}
                          </MultiSelectContent>
                        </MultiSelect>
                      )}
                    />
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="tasks">
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('tasks_can_be_added_after_creation')}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ProjectUnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
