import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { useProjectManagementStore } from '../store/project-management-store';
import { getProject } from '@/lib/api/project/get-project';
import { updateProject } from '@/lib/api/project/update-project';
import { deleteProject } from '@/lib/api/project/delete-project';
import { createTask } from '@/lib/api/project/create-task';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { listUserOptions } from '@/lib/api/user/list-user-options';
import { updateProjectSchema, createTaskSchema, cleanProjectFormData, type UpdateProjectFormData, type CreateTaskFormData } from '../schemas/project-schemas';
import { useToast } from '@/hooks/use-toast';
import { DivisionListResponse } from '@/types/division/division';
import { UserOption } from '@/types/user/user';
import { Project } from '@/types/project/project';
import { ProjectDetailsTab } from './project-details-tab';
import { TaskTab } from './task-tab';
import { DeleteProjectDialog } from './delete-project-dialog';
import { AddNewTaskDialog } from './add-new-task-dialog';
import { ProjectUnsavedChangesDialog } from './unsaved-changes-dialog';
import { useTranslation } from '@/hooks/use-translation';

export function EditProjectSheet() {
  const { toast } = useToast();
  const { closeEditMode, selectedProject, updateProjectInList, removeProject } = useProjectManagementStore();
  const { t } = useTranslation('project');
  const [project, setProject] = useState<Project | null>(selectedProject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      id: 0,
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      division_ids: [],
      member_ids: [],
    },
    mode: 'onChange',
  });

  const taskForm = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      assigned_to: undefined,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [divisionsRes, usersRes, projectRes] = await Promise.all([
          listDivisions(),
          listUserOptions(),
          getProject({ id: selectedProject!.id }),
        ]);
        setDivisions(divisionsRes.divisions || []);
        setUsers(usersRes.users || []);
        setProject(projectRes.project);

        form.reset({
          id: projectRes.project.id,
          name: projectRes.project.name,
          description: projectRes.project.description || '',
          start_date: projectRes.project.start_date?.slice(0, 10) || '',
          end_date: projectRes.project.end_date?.slice(0, 10) || '',
          status: projectRes.project.status,
          division_ids: projectRes.project.divisions?.map((d) => d.id) || [],
          member_ids: projectRes.project.members?.map((m) => m.id) || [],
        });
      } catch (error) {
        toast.error(error, { title: t('failed_to_load_project_details') });
      } finally {
        setLoadingData(false);
      }
    };
    if (selectedProject) {
      loadData();
    }
  }, [selectedProject]);

  const watchedFields = form.watch();
  useEffect(() => {
    if (!loadingData && project && !hasUnsavedChanges) {
      const hasChanges =
        watchedFields.name !== project.name ||
        (watchedFields.description || '') !== (project.description || '') ||
        watchedFields.status !== project.status;
      if (hasChanges) {
        setHasUnsavedChanges(true);
      }
    }
  }, [watchedFields, loadingData, project, hasUnsavedChanges]);

  const refreshProject = async () => {
    try {
      const response = await getProject({ id: project!.id });
      setProject(response.project);
      updateProjectInList(response.project);
    } catch (error) {
      toast.error(error, { title: t('failed_to_refresh_project') });
    }
  };

  const onSubmit = async (data: UpdateProjectFormData) => {
    const { id } = toast.loading({ title: 'Updating project...' });
    try {
      setIsSubmitting(true);
      const cleanedData = cleanProjectFormData(data);
      const response = await updateProject(cleanedData);
      setProject(response.project);
      updateProjectInList(response.project);
      toast.success({ itemID: id, title: t('update_success') });
      closeEditMode();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('update_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const { id } = toast.loading({ title: 'Deleting project...' });
    try {
      await deleteProject({ id: project!.id });
      removeProject(project!.id);
      toast.success({ itemID: id, title: t('delete_success') });
      closeEditMode();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('delete_error') });
    }
  };

  const handleAddTask = async (data: CreateTaskFormData) => {
    const { id } = toast.loading({ title: 'Creating task...' });
    try {
      await createTask({
        project_id: project!.id,
        ...data,
      });
      toast.success({ itemID: id, title: t('task_create_success') });
      taskForm.reset();
      setShowAddTaskDialog(false);
      refreshProject();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('task_create_error') });
    }
  };

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

  if (!project) {
    closeEditMode();
    return null;
  }

  const canManageTasks = project.can_edit || false;

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
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{t('editProject.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.can_edit && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('editProject.button.delete')}
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          {!project.can_edit && (
            <div className="mb-6 p-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">{t('editProject.view_only_warning')}</p>
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">{t('editProject.tabs.details')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('editProject.tabs.tasks', { count: project.tasks?.length || 0 })}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <ProjectDetailsTab
                form={form}
                loadingData={loadingData}
                project={project}
                onSubmit={onSubmit}
                onCancel={handleBackClick}
                isSubmitting={isSubmitting}
                divisions={divisions}
                users={users}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <TaskTab
                project={project}
                onTasksChange={refreshProject}
                onAddTask={() => setShowAddTaskDialog(true)}
                canManage={canManageTasks}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        projectName={project.name}
      />

      <AddNewTaskDialog
        open={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        form={taskForm}
        onSubmit={handleAddTask}
        project={project}
      />

      <ProjectUnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
