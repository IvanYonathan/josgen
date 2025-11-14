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
import { useState } from 'react';

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
        size: 40,
        header: () => (
            <div className="flex h-full items-center justify-center">
                {t('actions')}
            </div>
        ),
        cell: ({ row }) => {
            const user = row.original;
            const { onEdit, onDelete, onView, deletingId } = actions;
            const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                                    onClick={() => {
                                        onDelete(user.id);
                                        setDeleteDialogOpen(false);
                                    }}
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
