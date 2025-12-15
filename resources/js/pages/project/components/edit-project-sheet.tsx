import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectItem, MultiSelectValueItem } from '@/components/ui/multi-select';
import { Loader2, ArrowLeft, Save, Trash2, AlertCircle, Plus } from 'lucide-react';
import { useProjectManagementStore } from '../store/project-management-store';
import { getProject } from '@/lib/api/project/get-project';
import { updateProject } from '@/lib/api/project/update-project';
import { deleteProject } from '@/lib/api/project/delete-project';
import { createTask } from '@/lib/api/project/create-task';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { listUsers } from '@/lib/api/user/list-users';
import { updateProjectSchema, createTaskSchema, cleanProjectFormData, type UpdateProjectFormData, type CreateTaskFormData } from '../schemas/project-schemas';
import { TaskList } from './task-list';
import { toast } from 'sonner';
import { DivisionListResponse } from '@/types/division/division';
import { User } from '@/types/user/user';
import { Project } from '@/types/project/project';

interface DivisionValueItemProps {
  value: string;
  divisions: DivisionListResponse[];
}

const DivisionValueItem: React.FC<DivisionValueItemProps> = ({ value, divisions }) => {
  const division = divisions.find(d => d.id === Number(value));
  return (
    <MultiSelectValueItem value={value}>
      {division?.name || value}
    </MultiSelectValueItem>
  );
};

interface MemberValueItemProps {
  value: string;
  users: User[];
}

const MemberValueItem: React.FC<MemberValueItemProps> = ({ value, users }) => {
  const user = users.find(u => u.id === Number(value));
  return (
    <MultiSelectValueItem value={value}>
      {user?.name || value}
    </MultiSelectValueItem>
  );
};

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

  const selectedDivisionIds = form.watch('division_ids');
  const filteredUsers = users.filter((user) => user.division_id && selectedDivisionIds?.includes(user.division_id));
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
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" {...form.register('name')} disabled={!project.can_edit} />
                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register('description')} rows={4} disabled={!project.can_edit} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input id="start_date" type="date" {...form.register('start_date')} disabled={!project.can_edit} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input id="end_date" type="date" {...form.register('end_date')} disabled={!project.can_edit} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={!project.can_edit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Divisions</Label>
                    <Controller
                      name="division_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect
                          key={`divisions-${divisions.length}-${field.value?.join(',')}`}
                          value={field.value?.map(String) || []}
                          onValueChange={(values) => field.onChange(values.map(Number))}
                        >
                          <MultiSelectTrigger>
                            <MultiSelectValue
                              placeholder="Select divisions..."
                              itemComponent={(props) => <DivisionValueItem {...props} divisions={divisions} />}
                            />
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
                  </div>

                  <div className="space-y-2">
                    <Label>Team Members</Label>
                    {!project.can_modify_members && (
                      <p className="text-sm text-yellow-600">Members cannot be modified because the project status is {project.status}</p>
                    )}
                    <Controller
                      name="member_ids"
                      control={form.control}
                      render={({ field }) => (
                        <MultiSelect
                          key={`members-${filteredUsers.length}-${field.value?.join(',')}`}
                          value={field.value?.map(String) || []}
                          onValueChange={(values) => field.onChange(values.map(Number))}
                        >
                          <MultiSelectTrigger>
                            <MultiSelectValue
                              placeholder="Select team members..."
                              itemComponent={(props) => <MemberValueItem {...props} users={filteredUsers} />}
                            />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            {filteredUsers.map((user) => (
                              <MultiSelectItem key={user.id} value={String(user.id)}>
                                {user.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectContent>
                        </MultiSelect>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={closeEditMode} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || loadingData || !project.can_edit}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <TaskList
                project={project}
                tasks={project.tasks || []}
                onTasksChange={refreshProject}
                onAddTask={() => setShowAddTaskDialog(true)}
                canManage={canManageTasks}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{project.name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={taskForm.handleSubmit(handleAddTask)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input id="task-title" {...taskForm.register('title')} placeholder="Enter task title" />
              {taskForm.formState.errors.title && <p className="text-sm text-destructive">{taskForm.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" {...taskForm.register('description')} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-start">Start Date</Label>
                <Input id="task-start" type="date" {...taskForm.register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-end">End Date</Label>
                <Input id="task-end" type="date" {...taskForm.register('end_date')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Controller
                name="assigned_to"
                control={taskForm.control}
                render={({ field }) => (
                  <Select value={field.value?.toString() || ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {project.members?.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddTaskDialog(false)}>Cancel</Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
