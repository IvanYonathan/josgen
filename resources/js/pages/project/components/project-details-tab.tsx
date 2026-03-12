import { Controller, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectItem, MultiSelectValueItem } from '@/components/ui/multi-select';
import { Loader2, Save } from 'lucide-react';
import { UpdateProjectFormData } from '../schemas/project-schemas';
import { DivisionListResponse } from '@/types/division/division';
import { UserOption } from '@/types/user/user';
import { Project } from '@/types/project/project';
import { useTranslation } from '@/hooks/use-translation';

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
  users: UserOption[];
}

const MemberValueItem: React.FC<MemberValueItemProps> = ({ value, users }) => {
  const user = users.find(u => u.id === Number(value));
  return (
    <MultiSelectValueItem value={value}>
      {user?.name || value}
    </MultiSelectValueItem>
  );
};

interface ProjectDetailsTabProps {
  form: UseFormReturn<UpdateProjectFormData>;
  loadingData: boolean;
  project: Project;
  onSubmit: (data: UpdateProjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  divisions: DivisionListResponse[];
  users: UserOption[];
}

export function ProjectDetailsTab({
  form,
  loadingData,
  project,
  onSubmit,
  onCancel,
  isSubmitting,
  divisions,
  users,
}: ProjectDetailsTabProps) {
  const { t } = useTranslation('project');
  const selectedDivisionIds = form.watch('division_ids');
  const filteredUsers = users.filter((user) =>
    user.division_ids?.some((id) => selectedDivisionIds?.includes(id)) ||
    (user.division_id && selectedDivisionIds?.includes(user.division_id))
  );

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t('editProject.form.name.label')}</Label>
        <Input id="name" {...form.register('name')} disabled={!project.can_edit} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('editProject.form.description.label')}</Label>
        <Textarea id="description" {...form.register('description')} rows={4} disabled={!project.can_edit} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">{t('editProject.form.start_date.label')}</Label>
          <Input id="start_date" type="date" {...form.register('start_date')} disabled={!project.can_edit} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">{t('editProject.form.end_date.label')}</Label>
          <Input id="end_date" type="date" {...form.register('end_date')} disabled={!project.can_edit} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('editProject.form.status.label')}</Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!project.can_edit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">{t('planning')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="on_hold">{t('on_hold')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('editProject.form.division_ids.label')}</Label>
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
                  placeholder={t('editProject.form.division_ids.placeholder')}
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
        <Label>{t('editProject.form.member_ids.label')}</Label>
        {!project.can_modify_members && (
          <p className="text-sm text-yellow-600">
            {t('editProject.members_cannot_modify', { status: t(project.status) })}
          </p>
        )}
        <Controller
          name="member_ids"
          control={form.control}
          render={({ field }) => (
            <MultiSelect
              key={`members-${filteredUsers.length}-${field.value?.join(',')}`}
              value={field.value?.map(String) || []}
              onValueChange={(values) => {
                if (project.can_edit && project.can_modify_members) {
                  field.onChange(values.map(Number));
                }
              }}
            >
              <MultiSelectTrigger disabled={!project.can_edit || !project.can_modify_members}>
                <MultiSelectValue
                  placeholder={t('editProject.form.member_ids.placeholder')}
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('editProject.button.cancel')}
        </Button>
        {project.can_edit && (
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || loadingData}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {t('editProject.button.save')}
          </Button>
        )}
      </div>
    </form>
  );
}
