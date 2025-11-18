import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { CreateRoleSheet } from './components/create-role-sheet';
import { EditRoleSheet } from './components/edit-role-sheet';
import { RoleDetailView } from './components/role-detail-view';
import { listRoles } from '@/lib/api/role/list-role';
import { getRoleWithUsers } from '@/lib/api/role/get-role';
import { deleteRole } from '@/lib/api/role/delete-role';
import { me } from '@/lib/api/auth/me';
import { Role, RolePermission } from '@/types/role/role';
import { Loader2, PlusCircle, RefreshCw, Shield, ShieldAlert, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/tables/data-table';
import { useRoleColumns } from './columns/role-table-columns';
import { formatRoleLabel } from '@/lib/utils/role-label';
import { useDataTable } from '@/hooks/use-data-table';

const sortRoles = (roles: Role[]) => [...roles].sort((a, b) => a.name.localeCompare(b.name));

type ViewMode = 'list' | 'detail';

export default function RolePage() {
  const { t } = useTranslation('role');
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [detailUsers, setDetailUsers] = useState<Array<{ id: number; name: string; email: string; avatar?: string | null }>>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [canCreateRole, setCanCreateRole] = useState(false);
  const [canEditRole, setCanEditRole] = useState(false);
  const [canDeleteRole, setCanDeleteRole] = useState(false);

  const selectedRole = selectedRoleId ? roles.find((role) => role.id === selectedRoleId) ?? null : null;

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
    setRoles((prev) => sortRoles([...prev, role]));
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

      if (viewMode === 'detail' && deleteTarget.id === detailRole?.id) {
        handleBackToList();
      }
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

  const handleViewDetails = async (role: Role) => {
    setSelectedRoleId(role.id);
    setViewMode('detail');
    await loadRoleDetail(role.id);
  };

  const loadRoleDetail = async (roleId: number) => {
    try {
      setDetailLoading(true);
      setDetailError(null);

      const response = await getRoleWithUsers({ id: roleId });

      setDetailRole(response.role);
      setDetailUsers(response.users ?? []);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load role details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToList = async () => {
    setViewMode('list');
    setSelectedRoleId(null);
    setDetailRole(null);
    setDetailUsers([]);
    setDetailError(null);

    await loadData(true);
  };

  const columns = useRoleColumns({
    onEdit: (role) => {
      setSelectedRoleId(role.id);
      setEditSheetOpen(true);
    },
    onDelete: (role) => {
      setSelectedRoleId(role.id);
      openDeleteDialog(role);
    },
    onViewDetails: handleViewDetails,
    canEditRole,
    canDeleteRole,
    selectedRoleId,
  });

  const { table } = useDataTable<Role>({
    data: roles,
    setData: setRoles,
    columns,
    manualProcessing: true,
    replaceParamOnStateChange: false,
    initialState: {
      pagination: {
        pageIndex: 1,
        pageSize: 100,
      },
      sorting: [{ id: 'name', desc: false }],
    },
    getRowId: (originalRow) => String(originalRow.id),
  });

  return (
    <>
      {viewMode === 'list' ? (
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
            <div>
              <CardTitle>{t('table.title')}</CardTitle>
              <CardDescription>{t('table.description')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('table.loading')}
              </div>
            )}
            {!loading && roles.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">{t('table.empty')}</div>
            )}
            {!loading && roles.length > 0 && (
              <DataTable
                table={table}
                hidePaginationControls={true}
              />
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      ) : (
        <RoleDetailView
          role={detailRole}
          users={detailUsers}
          loading={detailLoading}
          error={detailError}
          canDeleteRole={canDeleteRole}
          onBack={handleBackToList}
          onDelete={openDeleteDialog}
        />
      )}

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
    </>
  );
}
