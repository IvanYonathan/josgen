import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Trash2, Plus, Edit } from 'lucide-react';
import { ProjectTask, Project } from '@/types/project/project';
import { toggleTaskCompletion } from '@/lib/api/project/toggle-task-completion';
import { deleteTask } from '@/lib/api/project/delete-task';
import { updateTask } from '@/lib/api/project/update-task';
import { updateTaskSchema, type UpdateTaskFormData } from '../schemas/project-schemas';
import { useToast } from '@/hooks/use-toast';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { useTranslation } from '@/hooks/use-translation';

interface TaskListProps {
  project: Project;
  tasks: ProjectTask[];
  onTasksChange: () => void;
  onAddTask: () => void;
  canManage: boolean;
}

export function TaskList({ project, tasks, onTasksChange, onAddTask, canManage }: TaskListProps) {
  const { toast } = useToast();
  const { t } = useTranslation('project');
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
      toast.error(new Error(t('select_at_least_one_task')), { title: 'Validation error' });
      return;
    }

    const { id } = toast.loading({ title: t('tasks_toggled_success', { count: selectedTaskIds.size }) });
    try {
      setTogglingTasks(true);
      await toggleTaskCompletion({ task_ids: Array.from(selectedTaskIds) });
      toast.success({ itemID: id, title: t('tasks_toggled_success', { count: selectedTaskIds.size }) });
      setSelectedTaskIds(new Set());
      onTasksChange();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('failed_to_toggle_tasks') });
    } finally {
      setTogglingTasks(false);
    }
  };

  const handleDeleteTask = (task: ProjectTask) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    const { id } = toast.loading({ title: 'Deleting task...' });
    try {
      setIsDeleting(true);
      await deleteTask({ id: taskToDelete.id });
      toast.success({ itemID: id, title: t('task_delete_success') });
      setTaskToDelete(null);
      onTasksChange();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('task_delete_error') });
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
    const { id } = toast.loading({ title: 'Updating task...' });
    try {
      setIsSubmitting(true);
      await updateTask(data);
      toast.success({ itemID: id, title: t('task_update_success') });
      setEditingTask(null);
      editForm.reset();
      onTasksChange();
    } catch (error) {
      toast.error(error, { itemID: id, title: t('task_update_error') });
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
        <p className="text-muted-foreground mb-4">{t('no_tasks_yet')}</p>
        {canManage && (
          <Button onClick={onAddTask} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('add_first_task')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{t('selected_count', { count: selectedTaskIds.size })}</span>
          <Button size="sm" onClick={handleBulkToggleCompletion} disabled={togglingTasks}>
            {togglingTasks && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {t('toggle_completion')}
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
          <span className="text-sm font-medium">{t('tasks_tab', { count: tasks.length })}</span>
          {canManage && (
            <Button size="sm" variant="ghost" onClick={onAddTask} className="ml-auto">
              <Plus className="h-4 w-4 mr-1" />
              {t('add_task')}
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
                      {t('completed_label')}
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {task.start_date && <span>{t('task_start', { date: new Date(task.start_date).toLocaleDateString() })}</span>}
                  {task.end_date && <span>{t('task_end', { date: new Date(task.end_date).toLocaleDateString() })}</span>}
                  {task.assigned_user?.name && <span>{t('task_assigned_to', { name: task.assigned_user.name })}</span>}
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

      <EditTaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        form={editForm}
        onSubmit={handleUpdateTask}
        project={project}
        isSubmitting={isSubmitting}
      />

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
