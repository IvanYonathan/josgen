import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

import { addTodoItem } from '@/lib/api/todo-list/items/add-todo-item';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { TodoList } from '@/types/todo-list/todo-list';

const addTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assigned_to: z.number().optional(),
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface AddTodoListTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoList: TodoList | null;
  onSuccess: () => void;
}

export function AddTodoListTaskDialog({ open, onOpenChange, todoList, onSuccess }: Readonly<AddTodoListTaskDialogProps>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      assigned_to: undefined,
    },
  });

  const onSubmit = async (data: AddTaskFormData) => {
    if (!todoList) return;

    try {
      setIsSubmitting(true);
      await addTodoItem({
        todo_list_id: todoList.id,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority,
        assigned_to: data.assigned_to,
      });
      toast.success({ title: 'Task added successfully' });
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error({ title: error instanceof Error ? error.message : 'Failed to add task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              {...form.register('title')}
              placeholder="Enter task title"
              disabled={isSubmitting}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              {...form.register('description')}
              rows={3}
              placeholder="Enter task description"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority *</Label>
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
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
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
                      {/* TODO(IvanYonathan): Load division members here */}
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
              {isSubmitting ? 'Adding...' : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
