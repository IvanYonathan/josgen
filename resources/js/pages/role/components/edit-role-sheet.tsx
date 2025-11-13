import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { getRole } from '@/lib/api/role/get-role';
import { updateRole } from '@/lib/api/role/update-role';
import { Role, RolePermission } from '@/types/role/role';
import { PermissionSelector } from './permission-selector';

interface EditRoleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: number | null;
  permissions: RolePermission[];
  onRoleUpdated: (role: Role) => void;
  canSubmit?: boolean;
}

export function EditRoleSheet({
  open,
  onOpenChange,
  roleId,
  permissions,
  onRoleUpdated,
  canSubmit = true,
}: Readonly<EditRoleSheetProps>) {
  const { toast } = useToast();
  const { t } = useTranslation('role');

  const [name, setName] = useState('');
  const [guard, setGuard] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleProtected, setRoleProtected] = useState(false);

  useEffect(() => {
    if (open && roleId) {
      void loadRole(roleId);
    } else if (!open) {
      resetState();
    }
  }, [open, roleId]);

  const resetState = () => {
    setName('');
    setGuard('');
    setSelectedPermissions([]);
    setLoadingRole(false);
    setSaving(false);
    setError(null);
    setRoleProtected(false);
  };

  const loadRole = async (id: number) => {
    try {
      setLoadingRole(true);
      setError(null);
      const response = await getRole({ id });
      const role = response.role;
      setName(role.name);
      setGuard(role.guard_name);
      setSelectedPermissions(role.permissions?.map((permission) => permission.name) ?? []);
      setRoleProtected(Boolean(role.is_protected));
    } catch (err: any) {
      const message = err?.response?.data?.message || t('editRole.messages.loadError');
      setError(message);
    } finally {
      setLoadingRole(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleId || !canSubmit || saving) return;

    if (!name.trim()) {
      setError(t('createRole.form.name.helper'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateRole({
        id: roleId,
        name: name.trim(),
        guard_name: guard.trim() || undefined,
        permissions: selectedPermissions,
      });

      onRoleUpdated(response.role);
      toast({ title: t('editRole.messages.success') });
      onOpenChange(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || t('editRole.messages.error');
      setError(message);
      toast({
        variant: 'destructive',
        title: t('editRole.messages.error'),
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {roleId ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>{t('editRole.title')}</SheetTitle>
              <SheetDescription>{t('editRole.description')}</SheetDescription>
            </SheetHeader>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loadingRole ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('table.loading')}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-name">{t('editRole.form.name.label')}</Label>
                  <Input
                    id="edit-role-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!canSubmit || roleProtected || saving}
                  />
                  <p className="text-xs text-muted-foreground">{t('editRole.form.name.helper')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role-guard">{t('editRole.form.guard.label')}</Label>
                  <Input
                    id="edit-role-guard"
                    value={guard}
                    onChange={(event) => setGuard(event.target.value)}
                    disabled={!canSubmit || saving}
                  />
                  <p className="text-xs text-muted-foreground">{t('editRole.form.guard.helper')}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t('editRole.form.permissions.label')}</Label>
                  <PermissionSelector
                    permissions={permissions}
                    value={selectedPermissions}
                    onChange={setSelectedPermissions}
                    disabled={!canSubmit || saving}
                  />
                  <p className="text-xs text-muted-foreground">{t('editRole.form.permissions.helper')}</p>
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                  >
                    {t('editRole.button.cancel')}
                  </Button>
                  <Button type="submit" disabled={!canSubmit || saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('editRole.button.save')}
                  </Button>
                </SheetFooter>
              </>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>{t('editRole.title')}</SheetTitle>
              <SheetDescription>{t('detail.helper')}</SheetDescription>
            </SheetHeader>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('editRole.button.cancel')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
