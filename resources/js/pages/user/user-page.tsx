import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { deleteUser } from '@/lib/api/user/delete-user';
import { getUser } from '@/lib/api/user/get-user';
import { listUsers } from '@/lib/api/user/list-users';
import { User, UserRole } from '@/types/user/user';
import { Loader2, PlusCircle, RefreshCcwDot, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateUserSheet } from './components/create-user-sheet';
import { EditUserSheet } from './components/edit-user-sheet';
import { UserDataTable } from './components/user-data-table';
import { UserDetailView } from './components/user-detail-view';

const FALLBACK_ROLE_LABELS: Partial<Record<UserRole, string>> = {
    Sysadmin: 'System Admin',
    Division_Leader: 'Division Leader',
    Treasurer: 'Treasurer',
    Member: 'Member',
};

const DEFAULT_ROLE_ORDER: UserRole[] = ['Sysadmin', 'Division_Leader', 'Treasurer', 'Member'];

const formatRoleLabel = (role: string) =>
    role.replace(/_/g, ' ').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const LIMIT_OPTIONS = [10, 25, 50, 100];

type SortField = 'created_at' | 'updated_at' | 'name';
type SortDirection = 'asc' | 'desc';
type SortSelection = `${SortField}:${SortDirection}`;

const SORT_OPTIONS: Array<{ value: SortSelection; label: string }> = [
    { value: 'created_at:asc', label: 'Oldest created' },
    { value: 'created_at:desc', label: 'Newest created' },
    { value: 'updated_at:desc', label: 'Recently updated' },
    { value: 'updated_at:asc', label: 'Least recently updated' },
    { value: 'name:asc', label: 'Name A-Z' },
    { value: 'name:desc', label: 'Name Z-A' },
];

export default function UserPage() {
    const { t } = useTranslation('user');
    const { toast } = useToast();

    // State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createSheetOpen, setCreateSheetOpen] = useState(false);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [detailUser, setDetailUser] = useState<User | null>(null);
    const [roleLabels, setRoleLabels] = useState<Record<string, string>>(
        Object.fromEntries(Object.entries(FALLBACK_ROLE_LABELS).map(([key, value]) => [key, value as string])),
    );
    const [availableRoles, setAvailableRoles] = useState<UserRole[]>(DEFAULT_ROLE_ORDER);

    // Example template to hydrate labels from an API in the future:
    // useEffect(() => {
    //     async function loadRoleLabels() {
    //         try {
    //             const response = await listRoles();
    //             setRoleLabels(
    //                 response.roles.reduce((acc, role) => {
    //                     acc[role.slug] = role.display_name;
    //                     return acc;
    //                 }, {} as Record<string, string>),
    //             );
    //             setAvailableRoles(response.roles.map((role) => role.slug as UserRole));
    //         } catch (error) {
    //             console.error('Failed to load roles', error);
    //         }
    //     }
    //     loadRoleLabels();
    // }, []);

    // Query state
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
    const [sortSelection, setSortSelection] = useState<SortSelection | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [totalUsers, setTotalUsers] = useState<number | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setSearchTerm(searchInput.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [sortField, sortDirection] = (sortSelection ?? 'created_at:asc').split(':') as [SortField, SortDirection];

            const filters: Record<string, string | number | Array<string | number>> = {};

            if (searchTerm) {
                filters.name = searchTerm;
            }

            if (roleFilter !== 'all') {
                filters.role = roleFilter;
            }

            const response = await listUsers({
                page,
                limit,
                sort: { [sortField]: sortDirection },
                filters: Object.keys(filters).length > 0 ? filters : undefined,
            });

            if (page > 1 && response.users.length === 0) {
                setPage((prev) => Math.max(1, prev - 1));
                return;
            }

            setUsers(response.users);

            const uniqueRoles = Array.from(new Set(response.users.map((user) => user.role))) as UserRole[];

            if (uniqueRoles.length > 0) {
                setAvailableRoles((prev) => {
                    const merged = Array.from(new Set([...prev, ...uniqueRoles])) as UserRole[];
                    return merged.sort((a, b) => {
                        const orderA = DEFAULT_ROLE_ORDER.indexOf(a);
                        const orderB = DEFAULT_ROLE_ORDER.indexOf(b);
                        if (orderA === -1 && orderB === -1) {
                            return a.localeCompare(b);
                        }
                        if (orderA === -1) return 1;
                        if (orderB === -1) return -1;
                        return orderA - orderB;
                    });
                });

                setRoleLabels((prev) => {
                    const next = { ...prev };
                    uniqueRoles.forEach((role) => {
                        if (!next[role]) {
                            next[role] = FALLBACK_ROLE_LABELS[role] ?? formatRoleLabel(role);
                        }
                    });
                    return next;
                });
            }

            if (typeof response.total === 'number') {
                setTotalUsers(response.total);
                setHasNextPage(page * limit < response.total);
            } else {
                setTotalUsers(null);
                setHasNextPage(response.users.length === limit);
            }
        } catch (error: any) {
            setError(error.message || 'Failed to load users');
            setUsers([]);
            setHasNextPage(false);
        } finally {
            setLoading(false);
        }
    }, [limit, page, roleFilter, searchTerm, sortSelection]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handlers
    const handleUserCreated = async (_user: User) => {
        try {
            if (page !== 1) {
                setPage(1);
            } else {
                await fetchUsers();
            }
            toast({
                title: 'Success',
                description: 'User created successfully and list refreshed.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to refresh user list after creation',
            });
        }
    };

    const handleUserUpdated = async (updatedUser: User) => {
        try {
            await fetchUsers();
            if (detailUser && detailUser.id === updatedUser.id) {
                setDetailUser(updatedUser);
            }
            toast({
                title: 'Success',
                description: 'User updated successfully and list refreshed.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to refresh user list after update',
            });
        }
    };

    const handleUserDeleted = async (userId: number): Promise<void> => {
        try {
            await deleteUser({ id: userId });
            await fetchUsers();
            toast({
                title: t('success'),
                description: t('user_deleted'),
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: error.message || t('failed_to_delete_user'),
            });
        }
    };

    const handleViewUser = async (user: User) => {
        try {
            const response = await getUser({ id: user.id });
            setDetailUser(response.user);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description: error.message || t('failed_to_fetch_user_detail'),
            });
        }
    };

    const handleRoleFilterChange = (value: string) => {
        setPage(1);
        setRoleFilter((value as UserRole) ?? 'all');
    };

    const handleSortChange = (value: SortSelection) => {
        setPage(1);
        setSortSelection(value);
    };

    const handleLimitChange = (value: string) => {
        setPage(1);
        setLimit(Number(value));
    };

    const handlePreviousPage = () => {
        setPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            setPage((prev) => prev + 1);
        }
    };

    const resetFilters = useCallback(() => {
        setSearchInput('');
        setSearchTerm('');
        setRoleFilter('all');
        setSortSelection(undefined);
        setLimit(10);
        setPage(1);
    }, []);

    const sortLabel = sortSelection ? (SORT_OPTIONS.find((option) => option.value === sortSelection)?.label ?? '') : '';

    const startItem = (page - 1) * limit + 1;
    const endItem = startItem + users.length - 1;
    const effectiveEnd = totalUsers !== null ? Math.min(endItem, totalUsers) : endItem;
    const totalPages = totalUsers !== null ? Math.max(1, Math.ceil(totalUsers / limit)) : null;

    return (
        <div className="p-6">
            {detailUser ? (
                <UserDetailView
                    user={detailUser}
                    onUserUpdated={handleUserUpdated}
                    onBack={async () => {
                        setDetailUser(null);
                        await fetchUsers();
                    }}
                />
            ) : (
                <>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold">{t('users')}</h1>
                            <Button variant="outline" size="sm" onClick={() => fetchUsers()} disabled={loading} className="flex items-center gap-2">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        <Button onClick={() => setCreateSheetOpen(true)} disabled={loading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('create_user')}
                        </Button>
                    </div>

                    {/* Filters Row */}
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
                        <div className="min-w-[260px] flex-[2]">
                            <label className="text-muted-foreground mb-2 block text-sm font-medium">Search</label>
                            <Input
                                placeholder="Search by name or email"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                autoComplete="off"
                            />
                        </div>

                        <div className="min-w-[200px] flex-[1.3]">
                            <label className="text-muted-foreground mb-2 block text-sm font-medium">Role</label>
                            <Select value={roleFilter === 'all' ? undefined : roleFilter} onValueChange={handleRoleFilterChange} disabled={loading}>
                                <SelectTrigger className={!roleFilter || roleFilter === 'all' ? 'text-muted-foreground' : ''}>
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All roles</SelectItem>
                                    {availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabels[role] ?? formatRoleLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[60px]">
                            <label className="text-muted-foreground mb-2 block text-sm font-medium">Items per page</label>
                            <Select value={String(limit)} onValueChange={handleLimitChange} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Items per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LIMIT_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={String(option)}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Reset Button */}
                        <div className="flex items-end">
                            <Button variant="ghost" size="icon" onClick={resetFilters} disabled={loading} aria-label="Reset filters">
                                <RefreshCcwDot className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {error && <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">No users found</p>
                        </div>
                    ) : (
                        <>
                            <UserDataTable
                                users={users}
                                loading={loading}
                                onEdit={(user) => {
                                    setSelectedUser(user);
                                    setEditSheetOpen(true);
                                }}
                                onDelete={handleUserDeleted}
                                onView={handleViewUser}
                            />

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-muted-foreground text-sm">
                                    Showing {startItem}-{effectiveEnd}
                                    {totalUsers !== null ? ` of ${totalUsers}` : ''} users {sortLabel}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={page === 1 || loading}>
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium">
                                        Page {page}
                                        {totalPages !== null ? ` of ${totalPages}` : ''}
                                    </span>
                                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasNextPage || loading}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            <CreateUserSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} onUserCreated={handleUserCreated} />

            {selectedUser && (
                <EditUserSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} user={selectedUser} onUserUpdated={handleUserUpdated} />
            )}
        </div>
    );
}
