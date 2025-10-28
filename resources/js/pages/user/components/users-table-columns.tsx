import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types/user/user';
import { UserAvatar } from '@/components/user/user-avatar';
import { RoleBadge } from '@/components/user/role-badge';
import { DataTableColumnHeader } from '@/components/common/tables/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { TFunction } from '@/hooks/use-translation';

export interface UserTableActions {
    onEdit: (user: User) => void;
    onDelete: (userId: number) => Promise<void>;
    onView?: (user: User) => void;
    deletingId?: number | null;
}

export const createUserColumns = (t: TFunction, actions: UserTableActions): ColumnDef<User>[] => [
    {
        id: 'avatar',
        header: () => <div aria-label={t('avatar')} />,
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
        cell: ({ row }) => <div className="break-words whitespace-normal">{row.getValue('email')}</div>,
        enableSorting: true,
    },
    {
        accessorKey: 'role',
        header: () => <div className="text-left">{t('role')}</div>,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
        enableSorting: false,
    },
    {
        id: 'division',
        header: () => <div className="text-left">{t('division')}</div>,
        cell: ({ row }) => (
            <div className="break-words whitespace-normal">{row.original.division?.name || '-'}</div>
        ),
        enableSorting: false,
    },
    {
        id: 'actions',
        header: () => (
            <div className="flex h-full items-center justify-center text-center">
                {t('actions')}
            </div>
        ),
        cell: ({ row }) => {
            const user = row.original;
            const { onEdit, onDelete, onView, deletingId } = actions;

            return (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {onView && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onView(user)}
                            className="min-w-[80px]"
                        >
                            {t('view')}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="min-w-[80px]"
                    >
                        {t('edit')}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === user.id}
                                className="min-w-[80px]"
                            >
                                {deletingId === user.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('deleting')}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('delete')}
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('delete_user')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t.rich('confirm_delete', { userName: user.name })}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {t('delete')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
        },
        enableSorting: false,
    },
];
