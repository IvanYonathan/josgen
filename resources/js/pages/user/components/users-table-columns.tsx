import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types/user/user';
import { UserAvatar } from '@/components/user/user-avatar';
import { RoleBadge } from '@/components/user/role-badge';
import { DataTableColumnHeader } from '@/components/common/tables/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Trash2, Eye, Pencil } from 'lucide-react';
import { TFunction } from '@/hooks/use-translation';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

export interface UserTableActions {
    onEdit: (user: User) => void;
    onDeleteClick: (user: User) => void;
    onView?: (user: User) => void;
    deletingId?: number | null;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const createUserColumns = (t: TFunction, actions: UserTableActions): ColumnDef<User>[] => [
    {
        id: 'avatar',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('avatar')} />,
        cell: ({ row }) => <UserAvatar user={row.original} />,
        enableSorting: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('name')} />,
        cell: ({ row }) => <div className="break-words whitespace-normal">{row.getValue('name')}</div>,
        enableSorting: true,
    },
    {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('email')} />,
        cell: ({ row }) => {
            const email = row.getValue('email') as string;
            const [local, domain] = email.split('@');
            const masked = local.slice(0, 4) + '****@' + domain;
            return <div className="break-words whitespace-normal">{masked}</div>;
        },
        enableSorting: true,
    },
    {
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('role')} />,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
        enableSorting: false,
    },
    {
        id: 'division',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('division')} />,
        cell: ({ row }) => (
            <div className="break-words whitespace-normal">{row.original.division?.name || '-'}</div>
        ),
        enableSorting: false,
    },
    {
        id: 'actions',
        size: 40,
        cell: ({ row }) => {
            const user = row.original;
            const { onEdit, onDeleteClick, onView, deletingId, canEdit = true, canDelete = true } = actions;
            const hasAnyAction = onView || canEdit || canDelete;

            if (!hasAnyAction) return null;

            return (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={deletingId === user.id}
                            >
                                {deletingId === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <DotsHorizontalIcon className="h-4 w-4" />
                                )}
                                <span className="sr-only">{t('actions')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {onView && (
                                <>
                                    <DropdownMenuItem onClick={() => onView(user)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('view')}
                                    </DropdownMenuItem>
                                    {(canEdit || canDelete) && <DropdownMenuSeparator />}
                                </>
                            )}
                            {canEdit && (
                                <DropdownMenuItem onClick={() => onEdit(user)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t('edit')}
                                </DropdownMenuItem>
                            )}
                            {canEdit && canDelete && <DropdownMenuSeparator />}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDeleteClick(user)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('delete')}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
        enableSorting: false,
    },
];
