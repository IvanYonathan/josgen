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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { RoleBadge } from '@/components/user/role-badge';
import { UserAvatar } from '@/components/user/user-avatar';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/types/user/user';
import { Loader2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/common/tables/data-table';
import { useMemo, useState, useEffect } from 'react';
import { createUserColumns } from './users-table-columns';
import { useDataTable } from '@/hooks/use-data-table';

/**
 * UserDataTable Component
 *
 * Responsive data table for user management.
 * - Desktop: TanStack Table with sortable columns (name, email)
 * - Mobile: Card-based UI (your existing design preserved)
 */

interface UserDataTableProps {
    users: User[];
    setUsers: (users: User[]) => void;
    loading: boolean;
    onEdit: (user: User) => void;
    onDelete: (userId: number) => Promise<void>;
    onView?: (user: User) => void;
    pagination: {
        page: number;
        limit: number;
        total: number | null;
        hasNextPage: boolean;
    };
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

export function UserDataTable({
    users,
    setUsers,
    loading,
    onEdit,
    onDelete,
    onView,
    pagination,
    onPageChange,
    onPageSizeChange,
}: Readonly<UserDataTableProps>) {
    const { t } = useTranslation('user');
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            setDeletingId(userToDelete.id);
            await onDelete(userToDelete.id);
            toast({
                title: t('success'),
                description: t('user_deleted'),
            });
        } catch (error) {
            const description = error instanceof Error ? error.message : t('delete_error');
            toast({
                variant: 'destructive',
                title: t('error'),
                description,
            });
        } finally {
            setDeletingId(null);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const columns = useMemo(
        () =>
            createUserColumns(t, {
                onEdit,
                onDeleteClick: handleDeleteClick,
                onView,
                deletingId,
            }),
        [t, onEdit, onView, deletingId]
    );

    const {
        table,
        pagination: tablePagination,
        setPageCount
    } = useDataTable<User>({
        data: users,
        setData: setUsers,
        columns,
        manualProcessing: false,
        replaceParamOnStateChange: false,
        initialState: {
            pagination: {
                pageIndex: pagination.page,
                pageSize: pagination.limit,
            },
        },
        getRowId: (originalRow) => String(originalRow.id),
    });

    useEffect(() => {
        if (tablePagination.pageIndex !== pagination.page) {
            onPageChange(tablePagination.pageIndex);
        }
        if (tablePagination.pageSize !== pagination.limit) {
            onPageSizeChange(tablePagination.pageSize);
        }
    }, [tablePagination.pageIndex, tablePagination.pageSize]);

    useEffect(() => {
        if (pagination.total) {
            setPageCount(Math.ceil(pagination.total / pagination.limit));
        }
    }, [pagination.total, pagination.limit, setPageCount]);

    const renderMobileActions = (user: User) => (
        <div className="flex w-full flex-col items-stretch gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-center">
            {onView && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onView(user)}
                    className="w-full sm:w-auto">
                    {t('view')}
                </Button>
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                className="w-full sm:w-auto">
                {t('edit')}
            </Button>
            <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === user.id}
                onClick={() => handleDeleteClick(user)}
                className="w-full sm:w-auto">
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
        </div>
    );

    return (
        <>
            {/* Desktop Table - TanStack Table with sortable columns */}
            <div className="hidden md:block">
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {!loading && users.length === 0 && (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">{t('noUsersFound')}</p>
                </div>
                )}
                {!loading && users.length > 0 && (
                    <DataTable table={table} hidePaginationControls={false} pageSizeOptions={[10, 25, 50, 100]} />
                )}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('delete_user')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete && t.rich('confirm_delete', { userName: userToDelete.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel}>
                            {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingId === userToDelete?.id}
                        >
                            {deletingId === userToDelete?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">{t('noUsersFound')}</p>
                    </div>
                ) : (
                    users.map((user) => (
                    <Card
                        key={user.id}
                        className="border-border border shadow-sm transition-shadow hover:shadow-md"
                    >
                        <CardHeader className="flex flex-row items-start gap-3 pb-2">
                            <UserAvatar user={user} />
                            <div className="min-w-0 space-y-1">
                                <CardTitle className="text-lg leading-tight break-words">
                                    {user.name}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground text-sm break-words">
                                    {user.email}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{t('role')}:</span>
                                <RoleBadge role={user.role} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{t('division')}:</span>
                                <span className="break-words">
                                    {user.division?.name || ' - '}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">{renderMobileActions(user)}</CardFooter>
                    </Card>
                    ))
                )}
            </div>
        </>
    );
}
