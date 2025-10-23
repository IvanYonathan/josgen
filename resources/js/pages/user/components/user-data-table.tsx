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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { RoleBadge } from '@/components/user/role-badge';
import { UserAvatar } from '@/components/user/user-avatar';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/types/user/user';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserDataTableProps {
    users: User[];
    loading: boolean;
    onEdit: (user: User) => void;
    onDelete: (userId: number) => Promise<void>;
    onView?: (user: User) => void;
}

export function UserDataTable({ users, loading, onEdit, onDelete, onView }: Readonly<UserDataTableProps>) {
    const { t } = useTranslation('user');
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleDelete = async (userId: number) => {
        try {
            setDeletingId(userId);
            await onDelete(userId);
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
        }
    };

    const renderActions = (user: User, stacked = false) => (
        <div
            className={
                stacked
                    ? 'flex w-full flex-col items-stretch gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-center'
                    : 'flex flex-wrap items-center justify-center gap-2'
            }
        >
            {onView && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onView(user)}
                    className={stacked ? 'w-full sm:w-auto' : 'min-w-[80px]'}
                >
                    {t('view')}
                </Button>
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                className={stacked ? 'w-full sm:w-auto' : 'min-w-[80px]'}
            >
                {t('edit')}
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === user.id}
                        className={stacked ? 'w-full sm:w-auto' : 'min-w-[80px]'}
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
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (loading) {
        return <div>{t('loading')}</div>;
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead aria-label={t('avatar')} />
                            <TableHead className="text-left align-middle">{t('name')}</TableHead>
                            <TableHead className="text-left align-middle">{t('email')}</TableHead>
                            <TableHead className="text-left align-middle">{t('role')}</TableHead>
                            <TableHead className="text-left align-middle">{t('division')}</TableHead>
                            <TableHead className="min-w-[240px]">
                                <div className="flex h-full items-center justify-center text-center">
                                    {t('actions')}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <UserAvatar user={user} />
                                </TableCell>
                                <TableCell className="break-words whitespace-normal">{user.name}</TableCell>
                                <TableCell className="break-words whitespace-normal">{user.email}</TableCell>
                                <TableCell>
                                    <RoleBadge role={user.role} />
                                </TableCell>
                                <TableCell className="break-words whitespace-normal">
                                    {user.division?.name || '-'}
                                </TableCell>
                                <TableCell className="min-w-[240px]">{renderActions(user)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
                {users.map((user) => (
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
                        <CardFooter className="pt-0">{renderActions(user, true)}</CardFooter>
                    </Card>
                ))}
            </div>
        </>
    );
}
