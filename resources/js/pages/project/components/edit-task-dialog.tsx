import { UseFormReturn, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UpdateTaskFormData } from '../schemas/project-schemas';
import { Project } from '@/types/project/project';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<UpdateTaskFormData>;
  onSubmit: (data: UpdateTaskFormData) => Promise<void>;
  project: Project;
  isSubmitting: boolean;
}

export function EditTaskDialog({ open, onOpenChange, form, onSubmit, project, isSubmitting }: EditTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Title</Label>
            <Input
              id="edit-title"
              {...form.register('title')}
              placeholder="Enter task title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              {...form.register('description')}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Start Date</Label>
              <Input id="edit-start" type="date" {...form.register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">End Date</Label>
              <Input id="edit-end" type="date" {...form.register('end_date')} />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Controller
              name="assigned_to"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Select
                    key={field.value?.toString() || 'unassigned'}
                    value={field.value?.toString() || ''}
                    onValueChange={(v) => {
                      const newValue = v ? Number(v) : null;
                      field.onChange(newValue);
                      form.setValue('assigned_to', newValue, { shouldDirty: true, shouldValidate: true });
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
                        form.setValue('assigned_to', null, { shouldDirty: true, shouldValidate: true });
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
              control={form.control}
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
              onClick={() => onOpenChange(false)}
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
  );
}
