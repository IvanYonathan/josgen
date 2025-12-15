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
import { listUsers } from '@/lib/api/user/list-users';
import { updateProjectSchema, createTaskSchema, cleanProjectFormData, type UpdateProjectFormData, type CreateTaskFormData } from '../schemas/project-schemas';
import { toast } from 'sonner';
import { DivisionListResponse } from '@/types/division/division';
import { User } from '@/types/user/user';
import { Project } from '@/types/project/project';
import { ProjectDetailsTab } from './project-details-tab';
import { TaskTab } from './task-tab';
import { DeleteProjectDialog } from './delete-project-dialog';
import { AddNewTaskDialog } from './add-new-task-dialog';

export function EditProjectSheet() {
  const { closeEditMode, selectedProject, updateProjectInList, removeProject } = useProjectManagementStore();
  const [project, setProject] = useState<Project | null>(selectedProject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
          listUsers(),
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
        toast.error('Failed to load project details');
      } finally {
        setLoadingData(false);
      }
    };
    if (selectedProject) {
      loadData();
    }
  }, [selectedProject]);

  const refreshProject = async () => {
    try {
      const response = await getProject({ id: project!.id });
      setProject(response.project);
      updateProjectInList(response.project);
    } catch (error) {
      toast.error('Failed to refresh project');
    }
  };

  const onSubmit = async (data: UpdateProjectFormData) => {
    try {
      setIsSubmitting(true);
      const cleanedData = cleanProjectFormData(data);
      const response = await updateProject(cleanedData);
      setProject(response.project);
      updateProjectInList(response.project);
      toast.success('Project updated successfully');
      closeEditMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject({ id: project!.id });
      removeProject(project!.id);
      toast.success('Project deleted successfully');
      closeEditMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleAddTask = async (data: CreateTaskFormData) => {
    try {
      await createTask({
        project_id: project!.id,
        ...data,
      });
      toast.success('Task created successfully');
      taskForm.reset();
      setShowAddTaskDialog(false);
      refreshProject();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  if (!project) {
    closeEditMode();
    return null;
  }

  const isManager = project.manager_id === project.manager?.id;
  const canManageTasks = project.can_edit || false;

  return (
    <div className="p-6">
      <div className="flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={closeEditMode} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">Edit project details and manage tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          {!project.can_edit && (
            <div className="mb-6 p-4 text-sm bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">You can view this project but don't have permission to edit it.</p>
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({project.tasks?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <ProjectDetailsTab
                form={form}
                loadingData={loadingData}
                project={project}
                onSubmit={onSubmit}
                onCancel={closeEditMode}
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
    </div>
  );
}
