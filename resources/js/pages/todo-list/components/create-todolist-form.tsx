import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createTodoList } from '@/lib/api/todo-list/create-todo-list';
import { listDivisions } from '@/lib/api/division/list-divisions';
import { useTodoListManagementStore } from '../store/todo-list-management-store';
import { DivisionListResponse } from '@/types/division/division';

const createTodoListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  type: z.enum(['personal', 'division']),
  division_id: z.number().optional(),
}).refine((data) => {
  if (data.type === 'division' && !data.division_id) {
    return false;
  }
  return true;
}, {
  message: 'Division is required for division todo lists',
  path: ['division_id'],
});

type CreateTodoListFormData = z.infer<typeof createTodoListSchema>;

interface CreateTodoListFormProps {
  type: 'personal' | 'division';
  onBack: () => void;
}

export function CreateTodoListForm({ type, onBack }: Readonly<CreateTodoListFormProps>) {
  const { toast } = useToast();
  const { addTodoList } = useTodoListManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [divisions, setDivisions] = useState<DivisionListResponse[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);

  const form = useForm<CreateTodoListFormData>({
    resolver: zodResolver(createTodoListSchema),
    defaultValues: {
      title: '',
      type: type,
      division_id: undefined,
    },
  });

  useEffect(() => {
    if (type === 'division') {
      const loadDivisions = async () => {
        try {
          setLoadingDivisions(true);
          const response = await listDivisions();
          setDivisions(response.divisions);
        } catch (error) {
          toast.error({ title: error instanceof Error ? error.message : 'Failed to load divisions' });
        } finally {
          setLoadingDivisions(false);
        }
      };
      loadDivisions();
    }
  }, [type, toast]);

  const onSubmit = async (data: CreateTodoListFormData) => {
    try {
      setIsSubmitting(true);
      const response = await createTodoList(data);
      addTodoList(response.todo_list);
      toast.success({ title: 'Todo list created successfully' });
      onBack();
      form.reset();
    } catch (error) {
      toast.error({ title: error instanceof Error ? error.message : 'Failed to create todo list' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Back to List
        </Button>
        <h1 className="text-2xl font-bold">Create New {type === 'personal' ? 'Personal' : 'Division'} Todo List</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Todo List Information</CardTitle>
            <CardDescription>
              Enter the details for your new todo list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Enter todo list title"
                disabled={isSubmitting}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            {type === 'division' && (
              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <Controller
                  name="division_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      disabled={isSubmitting || loadingDivisions}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDivisions ? "Loading divisions..." : "Select a division"} />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((division) => (
                          <SelectItem key={division.id} value={division.id.toString()}>
                            {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.division_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.division_id.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Todo List'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
