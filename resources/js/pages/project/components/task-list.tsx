import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, Circle, Trash2, Plus, Edit } from 'lucide-react';
import { ProjectTask, Project } from '@/types/project/project';
import { toggleTaskCompletion } from '@/lib/api/project/toggle-task-completion';
import { deleteTask } from '@/lib/api/project/delete-task';
import { updateTask } from '@/lib/api/project/update-task';
import { updateTaskSchema, type UpdateTaskFormData } from '../schemas/project-schemas';
import { toast } from 'sonner';
import { DeleteTaskDialog } from './delete-task-dialog';

interface TaskListProps {
  project: Project;
  tasks: ProjectTask[];
  onTasksChange: () => void;
  onAddTask: () => void;
  canManage: boolean;
}

export function TaskList({ project, tasks, onTasksChange, onAddTask, canManage }: TaskListProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [togglingTasks, setTogglingTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editForm = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      id: 0,
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      assigned_to: undefined,
      is_completed: false,
    },
  });

  const handleTaskToggle = (taskId: number) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((task) => task.id)));
    }
  };

  const handleBulkToggleCompletion = async () => {
    if (selectedTaskIds.size === 0) {
      toast.error('Please select at least one task');
      return;
    }

    try {
      setTogglingTasks(true);
      await toggleTaskCompletion({ task_ids: Array.from(selectedTaskIds) });
      toast.success(`${selectedTaskIds.size} task(s) toggled successfully`);
      setSelectedTaskIds(new Set());
      onTasksChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle tasks');
    } finally {
      setTogglingTasks(false);
    }
  };

  const handleDeleteTask = (task: ProjectTask) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTask({ id: taskToDelete.id });
      toast.success('Task deleted successfully');
      setTaskToDelete(null);
      onTasksChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    editForm.reset({
      id: task.id,
      title: task.title,
      description: task.description || '',
      start_date: task.start_date ? task.start_date.slice(0, 10) : '',
      end_date: task.end_date ? task.end_date.slice(0, 10) : '',
      assigned_to: task.assigned_to ?? null,
      is_completed: task.is_completed,
    });
  };

  const handleUpdateTask = async (data: UpdateTaskFormData) => {
    try {
      setIsSubmitting(true);
      await updateTask(data);
      toast.success('Task updated successfully');
      setEditingTask(null);
      editForm.reset();
      onTasksChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;
  const someSelected = selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4">No tasks yet</p>
        {canManage && (
          <Button onClick={onAddTask} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add First Task
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedTaskIds.size} selected</span>
          <Button size="sm" onClick={handleBulkToggleCompletion} disabled={togglingTasks}>
            {togglingTasks && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Toggle Completion
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 flex items-center gap-4 border-b">
          {canManage && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              {...(someSelected && { 'data-state': 'indeterminate' })}
            />
          )}
          <span className="text-sm font-medium">Tasks ({tasks.length})</span>
          {canManage && (
            <Button size="sm" variant="ghost" onClick={onAddTask} className="ml-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          )}
        </div>

        <div className="divide-y">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
              {canManage && (
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => handleTaskToggle(task.id)}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {task.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <h4
                    className={`font-medium ${
                      task.is_completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.is_completed && (
                    <Badge variant="outline" className="text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {task.start_date && <span>Start: {new Date(task.start_date).toLocaleDateString()}</span>}
                  {task.end_date && <span>End: {new Date(task.end_date).toLocaleDateString()}</span>}
                  {task.assigned_user?.name && <span>Assigned to: {task.assigned_user.name}</span>}
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEditTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteTask(task)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdateTask)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                {...editForm.register('title')}
                placeholder="Enter task title"
              />
              {editForm.formState.errors.title && (
                <p className="text-sm text-destructive">{editForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register('description')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start Date</Label>
                <Input id="edit-start" type="date" {...editForm.register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">End Date</Label>
                <Input id="edit-end" type="date" {...editForm.register('end_date')} />
                {editForm.formState.errors.end_date && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.end_date.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Controller
                name="assigned_to"
                control={editForm.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      key={field.value?.toString() || 'unassigned'}
                      value={field.value?.toString() || ''}
                      onValueChange={(v) => {
                        const newValue = v ? Number(v) : null;
                        field.onChange(newValue);
                        editForm.setValue('assigned_to', newValue, { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned - Select team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {project.members?.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          field.onChange(null);
                          editForm.setValue('assigned_to', null, { shouldDirty: true, shouldValidate: true });
                        }}
                      >
                        Clear Assignment
                      </Button>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="is_completed"
                control={editForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="edit-completed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="edit-completed" className="font-normal cursor-pointer">
                Mark as completed
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTask(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteTaskDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        taskTitle={taskToDelete?.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
