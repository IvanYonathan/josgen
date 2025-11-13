import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { CreateRoleSheet } from './components/create-role-sheet';
import { EditRoleSheet } from './components/edit-role-sheet';
import { listRoles } from '@/lib/api/role/list-role';
import { deleteRole } from '@/lib/api/role/delete-role';
import { me } from '@/lib/api/auth/me';
import { Role, RolePermission } from '@/types/role/role';
import { Loader2, Pencil, PlusCircle, RefreshCw, Shield, ShieldAlert, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sortRoles = (roles: Role[]) => [...roles].sort((a, b) => a.name.localeCompare(b.name));

function formatRoleLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RolePage() {
  const { t } = useTranslation('role');
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [canCreateRole, setCanCreateRole] = useState(false);
  const [canEditRole, setCanEditRole] = useState(false);
  const [canDeleteRole, setCanDeleteRole] = useState(false);

  const selectedRole = selectedRoleId ? roles.find((role) => role.id === selectedRoleId) ?? null : null;

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const term = search.trim().toLowerCase();
    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [roles, search]);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const [roleResponse, profileResponse] = await Promise.all([listRoles(), me()]);

      const sortedRoles = sortRoles(roleResponse.roles ?? []);
      setRoles(sortedRoles);
      setPermissions(roleResponse.permissions ?? []);

      setSelectedRoleId((current) => {
        if (current && sortedRoles.some((role) => role.id === current)) {
          return current;
        }
        return sortedRoles[0]?.id ?? null;
      });

      const perms = profileResponse.permissions;
      setCanCreateRole(Boolean(perms?.can_create_roles));
      setCanEditRole(Boolean(perms?.can_edit_roles));
      setCanDeleteRole(Boolean(perms?.can_delete_roles));
    } catch (err: any) {
      const fallback = tRef.current?.('table.loading') ?? 'Failed to load roles';
      const message = err?.response?.data?.message || fallback;
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRoleCreated = (role: Role) => {
    setRoles((prev) => {
      const next = sortRoles([...prev, role]);
      setSelectedRoleId(role.id);
      return next;
    });
  };

  const handleRoleUpdated = (role: Role) => {
    setRoles((prev) => {
      const next = prev.map((item) => (item.id === role.id ? role : item));
      return sortRoles(next);
    });
  };

  const openDeleteDialog = (role: Role) => {
    setDeleteTarget(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteRole({ id: deleteTarget.id });
      setRoles((prev) => {
        const next = prev.filter((role) => role.id !== deleteTarget.id);
        setSelectedRoleId((current) => {
          if (current === deleteTarget.id) {
            return next[0]?.id ?? null;
          }
          return current;
        });
        return next;
      });
      toast({ title: tRef.current?.('deleteRole.success') ?? 'Role deleted successfully' });
    } catch (err: any) {
      const fallback = tRef.current?.('deleteRole.error') ?? 'Failed to delete role';
      const message = err?.response?.data?.message || fallback;
      toast({
        variant: 'destructive',
        title: fallback,
        description: message,
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const renderPermissionsPreview = (role: Role) => {
    if (!role.permissions || role.permissions.length === 0) {
      return <span className="text-sm text-muted-foreground">{t('detail.noPermissions')}</span>;
    }

    const preview = role.permissions.slice(0, 3);
    const remaining = role.permissions.length - preview.length;

    return (
      <div className="flex flex-wrap gap-1">
        {preview.map((permission) => (
          <Badge key={permission.id} variant="outline" className="text-xs font-normal">
            {permission.name}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-xs font-normal">
            +{remaining}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadData(true)} disabled={loading || refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {t('buttons.refresh')}
          </Button>
          <Button onClick={() => setCreateSheetOpen(true)} disabled={!canCreateRole}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('buttons.create')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>{t('table.title')}</CardTitle>
                <CardDescription>{t('table.description')}</CardDescription>
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('table.searchPlaceholder')}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('table.loading')}
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">{t('table.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.role')}</TableHead>
                      <TableHead>{t('table.permissions')}</TableHead>
                      <TableHead>{t('table.updated')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow
                        key={role.id}
                        className={cn(
                          'cursor-pointer',
                          selectedRoleId === role.id ? 'bg-muted/60' : 'hover:bg-muted/40'
                        )}
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        <TableCell className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatRoleLabel(role.name)}</span>
                            {role.is_protected && (
                              <Badge variant="secondary" className="text-[10px] uppercase">
                                {t('detail.protected')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{role.guard_name}</p>
                        </TableCell>
                        <TableCell>{renderPermissionsPreview(role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(role.updated_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEditRole}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRoleId(role.id);
                              setEditSheetOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            {t('buttons.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canDeleteRole || role.is_protected}
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteDialog(role);
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {t('buttons.delete')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('detail.title')}</CardTitle>
            <CardDescription>
              {selectedRole ? formatRoleLabel(selectedRole.name) : t('detail.helper')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRole ? (
              <>
                <div className="space-y-3 rounded border p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{selectedRole.guard_name}</span>
                  </div>
                  {selectedRole.is_protected && (
                    <Badge variant="secondary" className="inline-flex items-center gap-1 text-[11px] uppercase">
                      <ShieldAlert className="h-3 w-3" />
                      {t('detail.protected')}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">{t('detail.guard')}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">
                    {t('detail.permissions')} ({selectedRole.permissions?.length ?? 0})
                  </p>
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-xs font-normal">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('detail.noPermissions')}</p>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {t('detail.metadata.created')}: {new Date(selectedRole.created_at).toLocaleString()}
                  </p>
                  <p>
                    {t('detail.metadata.updated')}: {new Date(selectedRole.updated_at).toLocaleString()}
                  </p>
                </div>

                <Tabs defaultValue="actions">
                  <TabsList>
                    <TabsTrigger value="actions">{t('table.actions')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="actions" className="space-y-2 pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!canEditRole}
                      onClick={() => setEditSheetOpen(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('buttons.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={!canDeleteRole || selectedRole.is_protected}
                      onClick={() => openDeleteDialog(selectedRole)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('buttons.delete')}
                    </Button>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('detail.helper')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateRoleSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        permissions={permissions}
        onRoleCreated={handleRoleCreated}
        canSubmit={canCreateRole}
      />

      <EditRoleSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        roleId={selectedRole?.id ?? null}
        permissions={permissions}
        onRoleUpdated={handleRoleUpdated}
        canSubmit={canEditRole}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRole.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteRole.description', { role: deleteTarget ? formatRoleLabel(deleteTarget.name) : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>{t('createRole.button.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteRole}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('deleteRole.button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
