import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDivision } from '@/lib/api/division/create-division';
import { addDivisionMember } from '@/lib/api/division/members/add-division-members';
import { CreateDivisionRequest, Division } from '@/types/division/division';
import { User } from '@/types/user/user';
import { useTranslation } from '@/hooks/use-translation';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateDivisionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDivisionCreated: (division: Division) => void;
  availableUsers: User[];
}

export function CreateDivisionSheet({
  open,
  onOpenChange,
  onDivisionCreated,
  availableUsers,
}: Readonly<CreateDivisionSheetProps>) {
  const { t } = useTranslation('division');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDivisionRequest>({
    name: '',
    description: '',
    leader_id: undefined,
  });
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: 'Division name is required' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Create the division
      const response = await createDivision(formData);
      const newDivision = response.division;

      // Add selected members if any
      if (selectedMembers.length > 0) {
        for (const member of selectedMembers) {
          try {
            await addDivisionMember({
              division_id: newDivision.id,
              user_id: member.id,
            });
          } catch (error) {
            console.warn(`Failed to add member ${member.name}:`, error);
          }
        }
      }

      // Reset form
      setFormData({ name: '', description: '', leader_id: undefined });
      setSelectedMembers([]);

      // Notify parent component
      onDivisionCreated(newDivision);

      // Close sheet
      onOpenChange(false);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create division'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = (userId: string) => {
    const user = availableUsers.find(u => u.id.toString() === userId);
    if (user && !selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(prev => [...prev, user]);
    }
  };

  const handleRemoveMember = (userId: number) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  };

  const availableUsersForSelection = availableUsers.filter(
    user => !selectedMembers.find(m => m.id === user.id)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{t('createDivision.title')}</SheetTitle>
            <SheetDescription>
              {t('createDivision.description')}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {errors.general}
              </div>
            )}

            {/* Division Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('createDivision.form.name.label')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('createDivision.form.name.placeholder')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t('createDivision.form.description.label')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('createDivision.form.description.placeholder')}
                rows={3}
              />
            </div>

            {/* Leader Selection */}
            <div className="grid gap-2">
              <Label htmlFor="leader">
                {t('createDivision.form.leader.label')}
              </Label>
              <Select
                value={formData.leader_id?.toString() || 'none'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  leader_id: value === 'none' ? undefined : parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('createDivision.form.leader.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No leader</SelectItem>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Members Selection */}
            <div className="grid gap-2">
              <Label>{t('createDivision.form.members.label')} (Optional)</Label>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedMembers.map(member => (
                    <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                      {member.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Member Select */}
              {availableUsersForSelection.length > 0 && (
                <Select onValueChange={handleAddMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add members to division" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsersForSelection.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('createDivision.button.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createDivision.button.create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}