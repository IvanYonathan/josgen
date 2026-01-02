import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { deleteTodoItem } from '@/lib/api/todo-list/items/delete-todo-item';
import { useToast } from '@/hooks/use-toast';
import { TodoItem } from '@/types/todo-list/todo-list';

interface DeleteTodoListTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoItem | null;
  onSuccess: () => void;
}

export function DeleteTodoListTaskDialog({ open, onOpenChange, task, onSuccess }: Readonly<DeleteTodoListTaskDialogProps>) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!task) return;

    try {
      setIsDeleting(true);
      await deleteTodoItem({ id: task.id });
      toast.success({ title: 'Task deleted successfully' });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error({ title: error instanceof Error ? error.message : 'Failed to delete task' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
