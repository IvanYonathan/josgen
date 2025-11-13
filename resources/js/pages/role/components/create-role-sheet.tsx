import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { createRole } from '@/lib/api/role/create-role';
import { Role, RolePermission } from '@/types/role/role';
import { PermissionSelector } from './permission-selector';

interface CreateRoleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: RolePermission[];
  onRoleCreated: (role: Role) => void;
  canSubmit?: boolean;
}

export function CreateRoleSheet({
  open,
  onOpenChange,
  permissions,
  onRoleCreated,
  canSubmit = true,
}: Readonly<CreateRoleSheetProps>) {
  const { toast } = useToast();
  const { t } = useTranslation('role');

  const [name, setName] = useState('');
  const [guard, setGuard] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setName('');
    setGuard('');
    setSelectedPermissions([]);
    setError(null);
    setLoading(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    if (!name.trim()) {
      setError(t('createRole.form.name.helper'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createRole({
        name: name.trim(),
        guard_name: guard.trim() || undefined,
        permissions: selectedPermissions,
      });

      onRoleCreated(response.role);
      toast({ title: t('createRole.messages.success') });
      handleClose(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || t('createRole.messages.error');
      setError(message);
      toast({
        variant: 'destructive',
        title: t('createRole.messages.error'),
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{t('createRole.title')}</SheetTitle>
            <SheetDescription>{t('createRole.description')}</SheetDescription>
          </SheetHeader>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role-name">{t('createRole.form.name.label')}</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('createRole.form.name.placeholder')}
              disabled={!canSubmit || loading}
            />
            <p className="text-xs text-muted-foreground">{t('createRole.form.name.helper')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-guard">{t('createRole.form.guard.label')}</Label>
            <Input
              id="role-guard"
              value={guard}
              onChange={(event) => setGuard(event.target.value)}
              placeholder={t('createRole.form.guard.placeholder')}
              disabled={!canSubmit || loading}
            />
            <p className="text-xs text-muted-foreground">{t('createRole.form.guard.helper')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('createRole.form.permissions.label')}</Label>
            <PermissionSelector
              permissions={permissions}
              value={selectedPermissions}
              onChange={setSelectedPermissions}
              disabled={!canSubmit || loading}
            />
            <p className="text-xs text-muted-foreground">{t('createRole.form.permissions.helper')}</p>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              {t('createRole.button.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createRole.button.create')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
