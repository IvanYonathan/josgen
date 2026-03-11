import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
      // guard_name is always 'web' — no need to load it
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

    const { id } = toast.loading({ title: t('editRole.messages.updating')});

    try {
      setSaving(true);
      setError(null);
      const response = await updateRole({
        id: roleId,
        name: name.trim(),
        guard_name: 'web',
        permissions: selectedPermissions,
      });

      onRoleUpdated(response.role);
      toast.success({ itemID: id, title: t('editRole.messages.success') });
      onOpenChange(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || t('editRole.messages.error');
      setError(message);
      toast.error(err, { itemID: id, title: t('editRole.messages.error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-hidden">
        {roleId ? (
          <>
            <SheetHeader>
              <SheetTitle>{t('editRole.title')}</SheetTitle>
              <SheetDescription>{t('editRole.description')}</SheetDescription>
            </SheetHeader>

            <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit}>
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-simple flex flex-col gap-3 px-6 py-4">
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
                      <Label>{t('editRole.form.permissions.label')}</Label>
                      <PermissionSelector
                        permissions={permissions}
                        value={selectedPermissions}
                        onChange={setSelectedPermissions}
                        disabled={!canSubmit || saving}
                      />
                      <p className="text-xs text-muted-foreground">{t('editRole.form.permissions.helper')}</p>
                    </div>
                  </>
                )}
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
                <Button type="submit" disabled={!canSubmit || saving || loadingRole}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('editRole.button.save')}
                </Button>
              </SheetFooter>
            </form>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{t('editRole.title')}</SheetTitle>
              <SheetDescription>{t('detail.helper')}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 px-6 py-4"></div>
            <div className="px-6 pb-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('editRole.button.cancel')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
