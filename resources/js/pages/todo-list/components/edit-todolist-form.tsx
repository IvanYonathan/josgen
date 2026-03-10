import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { updateTodoList } from '@/lib/api/todo-list/update-todo-list';
import { useTodoListManagementStore } from '../store/todo-list-management-store';
import { TodoList } from '@/types/todo-list/todo-list';

const editTodoListSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').max(255),
});

type EditTodoListFormData = z.infer<typeof editTodoListSchema>;

interface EditTodoListFormProps {
  todoList: TodoList | null;
  onBack: () => void;
}

export function EditTodoListForm({ todoList, onBack }: Readonly<EditTodoListFormProps>) {
  const { toast } = useToast();
  const { t } = useTranslation('todolist');
  const { updateTodoListInList } = useTodoListManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditTodoListFormData>({
    resolver: zodResolver(editTodoListSchema),
    defaultValues: {
      id: todoList?.id || 0,
      title: todoList?.title || '',
    },
  });

  useEffect(() => {
    if (todoList) {
      form.reset({
        id: todoList.id,
        title: todoList.title,
      });
    }
  }, [todoList, form]);

  const onSubmit = async (data: EditTodoListFormData) => {
    try {
      setIsSubmitting(true);
      const response = await updateTodoList(data);
      updateTodoListInList(response.todo_list);
      toast.success({ title: t('toast.updateSuccess') });
      onBack();
    } catch (error) {
      toast.error({ title: error instanceof Error ? error.message : t('toast.updateError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!todoList) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('form.backToList')}
          </Button>
          <h1 className="text-2xl font-bold">{t('form.editTitle')}</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('form.noSelected')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('form.backToList')}
        </Button>
        <h1 className="text-2xl font-bold">{t('form.editTitle')}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('form.cardTitle')}</CardTitle>
            <CardDescription>
              {t('form.editDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('form.titleLabel')}</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder={t('form.titlePlaceholder')}
                disabled={isSubmitting}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                {t('form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('form.updating') : t('form.updateButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
