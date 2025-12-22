import { UseFormReturn, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CreateTaskFormData } from '../schemas/project-schemas';
import { Project } from '@/types/project/project';
import { useTranslation } from '@/hooks/use-translation';

interface AddNewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CreateTaskFormData>;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  project: Project;
}

export function AddNewTaskDialog({ open, onOpenChange, form, onSubmit, project }: AddNewTaskDialogProps) {
  const { t } = useTranslation('project', { keyPrefix: 'dialog.addTask' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t('form.title.label')}</Label>
            <Input id="task-title" {...form.register('title')} placeholder={t('form.title.placeholder')} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">{t('form.description.label')}</Label>
            <Textarea id="task-description" {...form.register('description')} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">{t('form.start_date.label')}</Label>
              <Input id="task-start" type="date" {...form.register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-end">{t('form.end_date.label')}</Label>
              <Input id="task-end" type="date" {...form.register('end_date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('form.assigned_to.label')}</Label>
            <Controller
              name="assigned_to"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value?.toString() || ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.assigned_to.placeholder')} />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('button.cancel')}</Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {t('button.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
