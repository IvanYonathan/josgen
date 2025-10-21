import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user/user";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { UserAvatar } from "@/components/user/user-avatar";
import { RoleBadge } from "@/components/user/role-badge";
import { useTranslation } from "react-i18next";
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
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

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
                title: "Success",
                description: t('user_deleted')
            });
        } catch (error) {
            const description =
                error instanceof Error
                    ? error.message
                    : t('delete_error');
            toast({
                variant: "destructive",
                title: "Error",
                description
            });
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div>{t('loading')}</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('')}</TableHead>
                    <TableHead>{t('Name')}</TableHead>
                    <TableHead>{t('Email')}</TableHead>
                    <TableHead>{t('Role')}</TableHead>
                    <TableHead>{t('Division')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                            <UserAvatar user={user} />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>{user.division?.name || '-'}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                {onView && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onView(user)}
                                    >
                                        {t('view')}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(user)}
                                >
                                    {t('edit')}
                                </Button>

                                {/* 🔥 Replace confirm() with AlertDialog */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={deletingId === user.id}
                                        >
                                            {deletingId === user.id ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t('deleting')}
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {t('delete')}
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {t('Delete User')}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('Are you sure you want to delete')}{" "}
                                                <strong>{user.name}</strong>?{" "}
                                                {t('This action cannot be undone.')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {t('cancel')}
                                            </AlertDialogCancel>
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
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
