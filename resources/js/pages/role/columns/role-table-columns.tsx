import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Role } from '@/types/role/role';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/common/tables/data-table-column-header';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { formatRoleLabel } from '@/lib/utils/role-label';

export interface RoleTableActions {
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onRowClick: (role: Role) => void;
  canEditRole?: boolean;
  canDeleteRole?: boolean;
  selectedRoleId?: number | null;
}

export const useRoleColumns = (actions: RoleTableActions): ColumnDef<Role>[] => {
  const { t } = useTranslation('role');

  return useMemo(() => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.role')} />,
    cell: ({ row }) => {
      const role = row.original;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatRoleLabel(role.name)}</span>
            {role.is_protected && (
              <Badge variant="secondary" className="text-[10px] uppercase">
                {t('detail.protected')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{role.guard_name}</p>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'permissions',
    header: () => <div className="text-left">{t('table.permissions')}</div>,
    cell: ({ row }) => {
      const role = row.original;

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
    },
    enableSorting: false,
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('table.updated')} />,
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('updated_at')).toLocaleString()}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: () => (
      <div className="flex h-full items-center justify-end text-right">
        {t('table.actions')}
      </div>
    ),
    cell: ({ row }) => {
      const role = row.original;
      const { onEdit, onDelete, canEditRole = true, canDeleteRole = true } = actions;

      return (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!canEditRole}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(role);
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
              onDelete(role);
            }}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {t('buttons.delete')}
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
  ], [t, actions]);
};
