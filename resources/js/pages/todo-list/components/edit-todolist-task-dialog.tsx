import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';

import { updateTodoItem } from '@/lib/api/todo-list/items/update-todo-item';
import { listDivisionMembers } from '@/lib/api/division/members/list-division-members';
import { useToast } from '@/hooks/use-toast';
import { TodoItem, TodoList } from '@/types/todo-list/todo-list';
import { User } from '@/types/user/user';

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assigned_to: z.number().optional(),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

interface EditTodoListTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoItem | null;
  todoList: TodoList | null;
  onSuccess: () => void;
}

export function EditTodoListTaskDialog({ open, onOpenChange, task, todoList, onSuccess }: Readonly<EditTodoListTaskDialogProps>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<User[]>([]);

  const form = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      assigned_to: undefined,
    },
  });

  useEffect(() => {
    if (!open || !task) return;

    const resetForm = (loadedMembers: User[]) => {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority as 'low' | 'medium' | 'high',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        assigned_to: task.assigned_to?.id || undefined,
      });
      setMembers(loadedMembers);
    };

    if (todoList?.type === 'division' && todoList.division_id) {
      listDivisionMembers({ division_id: todoList.division_id })
        .then(res => resetForm(res.members))
        .catch(() => resetForm([]));
    } else {
      resetForm([]);
    }
  }, [open, task]);

  const onSubmit = async (data: EditTaskFormData) => {
    if (!task) return;

    try {
      setIsSubmitting(true);
      await updateTodoItem({
        id: task.id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority,
        assigned_to: data.assigned_to,
      });
      toast.success({ title: 'Task updated successfully' });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error({ title: error instanceof Error ? error.message : 'Failed to update task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Title *</Label>
            <Input
              id="edit-task-title"
              {...form.register('title')}
              placeholder="Enter task title"
              disabled={isSubmitting}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-task-description">Description</Label>
            <Textarea
              id="edit-task-description"
              {...form.register('description')}
              rows={3}
              placeholder="Enter task description"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-priority">Priority *</Label>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-due-date">Due Date</Label>
              <Input
                id="edit-task-due-date"
                type="date"
                {...form.register('due_date')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {todoList?.type === 'division' && (
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Controller
                name="assigned_to"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
