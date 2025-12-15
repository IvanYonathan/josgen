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
import { listUsers } from '@/lib/api/user/list-users';
import { createProjectSchema, cleanProjectFormData, type CreateProjectFormData } from '../schemas/project-schemas';
import { toast } from 'sonner';
import { DivisionListResponse } from '@/types/division/division';
import { User } from '@/types/user/user';
import { ProjectUnsavedChangesDialog } from './unsaved-changes-dialog';

export function CreateProjectSheet() {
  const { closeCreateMode, addProject } = useProjectManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
          listUsers(),
        ]);
        setDivisions(divisionsRes.divisions || []);
        setUsers(usersRes.users || []);
      } catch (error) {
        toast.error('Failed to load divisions and users');
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
    try {
      setIsSubmitting(true);
      const cleanedData = cleanProjectFormData(data);
      const response = await createProject(cleanedData);
      addProject(response.project);
      toast.success('Project created successfully');
      closeCreateMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDivisionIds = form.watch('division_ids');
  const filteredUsers = users.filter((user) => user.division_id && selectedDivisionIds.includes(user.division_id));

  return (
    <div className="p-6">
      <div className="flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackClick} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Project</h1>
              <p className="text-sm text-muted-foreground">Add a new project to your organization</p>
            </div>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || loadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        <div className="max-w-4xl space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="tasks" disabled>Tasks (Available After Creation)</TabsTrigger>
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
                      Project Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="name" {...form.register('name')} placeholder="Enter project name" />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register('description')} placeholder="Enter project description" rows={4} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">
                        Start Date <span className="text-destructive">*</span>
                      </Label>
                      <Input id="start_date" type="date" {...form.register('start_date')} />
                      {form.formState.errors.start_date && (
                        <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input id="end_date" type="date" {...form.register('end_date')} />
                      {form.formState.errors.end_date && (
                        <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Assigned Divisions <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="division_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect value={field.value?.map(String) || []} onValueChange={(values) => field.onChange(values.map(Number))}>
                          <MultiSelectTrigger>
                            <MultiSelectValue placeholder="Select divisions..." />
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
                    <Label>Team Members</Label>
                    <p className="text-sm text-muted-foreground">Select team members from the assigned divisions</p>
                    <Controller
                      name="member_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect value={field.value?.map(String) || []} onValueChange={(values) => field.onChange(values.map(Number))}>
                          <MultiSelectTrigger>
                            <MultiSelectValue placeholder={selectedDivisionIds.length === 0 ? 'Select divisions first...' : 'Select team members...'} />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            {filteredUsers.length === 0 ? (
                              <div className="p-4 text-sm text-muted-foreground text-center">No users found in selected divisions</div>
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
                <p>Tasks can be added after creating the project</p>
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
