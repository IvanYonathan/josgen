import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { deleteUser } from '@/lib/api/user/delete-user';
import { getUser } from '@/lib/api/user/get-user';
import { listUsers } from '@/lib/api/user/list-users';
import { listRoles } from '@/lib/api/role/list-role';
import { User, UserRole } from '@/types/user/user';
import { Loader2, PlusCircle, RefreshCcwDot, RefreshCw, Download, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { CreateUserSheet } from './components/create-user-sheet';
import { EditUserSheet } from './components/edit-user-sheet';
import { UserDataTable } from './components/user-data-table';
import { UserDetailView } from './components/user-detail-view';
import { UserManagementProvider, useUserManagementStore } from './store/user-management-store';
import { useFeatureFlags } from '@/stores/feature-flags-store';
import { formatRoleLabel } from '@/lib/utils/role-label';
import { DEFAULT_ROLE_SLUGS } from '@/constants/default-roles';
import { useAuth } from '@/contexts/auth-context';

const LIMIT_OPTIONS = [10, 25, 50, 100];

type SortField = 'created_at' | 'updated_at' | 'name' | 'email';
type SortDirection = 'asc' | 'desc';
type SortSelection = `${SortField}:${SortDirection}`;

const SORT_OPTIONS: Array<{ value: SortSelection; label: string }> = [
    { value: 'created_at:asc', label: 'Oldest created' },
    { value: 'created_at:desc', label: 'Newest created' },
    { value: 'updated_at:desc', label: 'Recently updated' },
    { value: 'updated_at:asc', label: 'Least recently updated' },
    { value: 'name:asc', label: 'Name A-Z' },
    { value: 'name:desc', label: 'Name Z-A' },
    { value: 'email:asc', label: 'Email A-Z' },
    { value: 'email:desc', label: 'Email Z-A' },
];

function UserPage() {
    const { t } = useTranslation('user');
    const { toast } = useToast();
    const { permissions } = useAuth();

    // Feature flags for conditional features
    const { userExportEnabled, userBulkActionsEnabled, userAdvancedFiltersEnabled } = useFeatureFlags();
    const store = useUserManagementStore();
    const {
        users,
        loading,
        error,
        pagination,
        filters,
        searchInput,
        sorting,
        createSheetOpen,
        editSheetOpen,
        selectedUser,
        detailUser,
        roleLabels = {},
        availableRoles = [],
    } = store;

    const {
        setUsers,
        setLoading,
        setError,
        setPagination,
        setSearchInput,
        setSearchTerm,
        setRoleFilter,
        setSorting,
        setPage,
        setLimit,
        nextPage,
        previousPage,
        setCreateSheetOpen,
        openEditSheet,
        closeEditSheet,
        setDetailUser,
        resetFilters,
        setRoleLabels,
        setAvailableRoles,
    } = store;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput, setSearchTerm]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Determine sort field and direction from TanStack Table sorting
            let sortField: SortField = 'created_at';
            let sortDirection: SortDirection = 'asc';

            if (sorting && sorting.length > 0) {
                const sort = sorting[0];
                sortField = sort.id as SortField;
                sortDirection = sort.desc ? 'desc' : 'asc';
            }

            const apiFilters: Record<string, string | number | Array<string | number>> = {};

            if (filters.searchTerm) {
                apiFilters.name = filters.searchTerm;
            }

            if (filters.roleFilter !== 'all') {
                apiFilters.role = filters.roleFilter;
            }

            const response = await listUsers({
                page: pagination.page,
                limit: pagination.limit,
                sort: { [sortField]: sortDirection },
                filters: Object.keys(apiFilters).length > 0 ? apiFilters : undefined,
            });

            if (pagination.page > 1 && response.users.length === 0) {
                setPage(Math.max(1, pagination.page - 1));
                return;
            }

            setUsers(response.users);

            if (typeof response.total === 'number') {
                setPagination({
                    total: response.total,
                    hasNextPage: pagination.page * pagination.limit < response.total,
                });
            } else {
                setPagination({
                    total: null,
                    hasNextPage: response.users.length === pagination.limit,
                });
            }
        } catch (error: any) {
            setError(error.message || 'Failed to load users');
            setUsers([]);
            setPagination({ hasNextPage: false });
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, pagination.page, filters.roleFilter, filters.searchTerm, sorting]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        let mounted = true;

        const loadRoles = async () => {
            try {
                const response = await listRoles();
                if (!mounted) return;

                const roleNames = Array.from(new Set(response.roles?.map((role) => role.name) ?? []));
                const effectiveRoles = roleNames.length > 0 ? roleNames : DEFAULT_ROLE_SLUGS;
                const sortedRoles = [...effectiveRoles].sort((a, b) =>
                    formatRoleLabel(a).localeCompare(formatRoleLabel(b))
                );

                const labels: Record<string, string> = {};
                sortedRoles.forEach((role) => {
                    labels[role] = formatRoleLabel(role);
                });

                setAvailableRoles(sortedRoles as UserRole[]);
                setRoleLabels(labels);
            } catch (error) {
                if (!mounted) return;
                const fallbackLabels: Record<string, string> = {};
                const sortedFallback = [...DEFAULT_ROLE_SLUGS].sort((a, b) =>
                    formatRoleLabel(a).localeCompare(formatRoleLabel(b))
                );
                sortedFallback.forEach((role) => {
                    fallbackLabels[role] = formatRoleLabel(role);
                });
                setAvailableRoles(sortedFallback as UserRole[]);
                setRoleLabels(fallbackLabels);
            }
        };

        void loadRoles();

        return () => {
            mounted = false;
        };
    }, [setAvailableRoles, setRoleLabels]);

    // Handlers
    const handleUserCreated = async (_user: User) => {
        const { id } = toast.loading({ title: t('toast.refreshing') });
        try {
            if (pagination.page !== 1) {
                setPage(1);
            }
            await fetchUsers();
            toast.success({ itemID: id, title: t('toast.refreshing') });
        } catch (error: any) {
            toast.error(error, { itemID: id, title: t('toast.refreshError') });
        }
    };

    const handleUserUpdated = async (updatedUser: User) => {
        const { id } = toast.loading({ title: t('toast.refreshing') });
        try {
            await fetchUsers();
            if (detailUser && detailUser.id === updatedUser.id) {
                setDetailUser(updatedUser);
            }
            toast.success({ itemID: id, title: t('toast.refreshing') });
        } catch (error: any) {
            toast.error(error, { itemID: id, title: t('toast.refreshError') });
        }
    };

    const handleUserDeleted = async (userId: number): Promise<void> => {
        const { id } = toast.loading({ title: t('toast.deleting') });
        try {
            await deleteUser({ id: userId });
            await fetchUsers();
            toast.success({ itemID: id, title: t('toast.deleteSuccess')});
        } catch (error: any) {
            toast.error(error, { itemID: id, title: t('toast.deleteError') });
        }
    };

    const handleViewUser = async (user: User) => {
        const { id } = toast.loading({ title: t('toast.viewingUser') });
        try {
            const response = await getUser({ id: user.id });
            setDetailUser(response.user);
            toast.success({ itemID: id, title: t('toast.viewUserSuccess') });
        } catch (error: any) {
            toast.error(error, { itemID: id, title: t('toast.viewUserError') });
        }
    };

    const handleRoleFilterChange = (value: string) => {
        if (value === 'all') {
            setRoleFilter('all');
            return;
        }
        setRoleFilter((value as UserRole) || 'all');
    };

    const handleSortChange = (value: SortSelection) => {
        const [field, direction] = value.split(':') as [SortField, SortDirection];
        setSorting([{ id: field, desc: direction === 'desc' }]);
    };

    const handleLimitChange = (value: string) => {
        setLimit(Number(value));
    };

    // Feature flag handlers (placeholder implementations)
    const handleExportUsers = () => {
        toast.warning({ title: 'Export feature coming soon!' });
    };

    const handleBulkDelete = () => {
        toast.warning({ title: 'Bulk delete feature coming soon!' });
    };

    const sortSelection =
        sorting && sorting.length > 0 ? (`${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` as SortSelection) : undefined;

    const sortLabel = sortSelection ? SORT_OPTIONS.find((option) => option.value === sortSelection)?.label ?? '' : '';

    const startItem = (pagination.page - 1) * pagination.limit + 1;
    const endItem = startItem + users.length - 1;
    const effectiveEnd = pagination.total !== null ? Math.min(endItem, pagination.total) : endItem;
    const totalPages = pagination.total !== null ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : null;

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
                                {t('refresh')}
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Feature Flag: Export */}
                            {userExportEnabled && (
                                <Button variant="outline" size="sm" onClick={handleExportUsers} disabled={loading}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('export')}
                                </Button>
                            )}

                            {/* Feature Flag: Bulk Actions */}
                            {userBulkActionsEnabled && (
                                <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={loading || users.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('bulkDelete')}
                                </Button>
                            )}

                            {permissions.can_create_users && (
                                <Button onClick={() => setCreateSheetOpen(true)} disabled={loading}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('create_user')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
                        <div className="min-w-[260px] flex-[2]">
                            <label className="text-muted-foreground mb-2 block text-sm font-medium">{t('search')}</label>
                            <Input
                                placeholder={t('searchPlaceholder')}
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                autoComplete="off"
                            />
                        </div>

                        <div className="min-w-[200px] flex-[1.3]">
                            <label className="text-muted-foreground mb-2 block text-sm font-medium">{t('roleFilter')}</label>
                            <Select
                                value={filters.roleFilter === 'all' ? undefined : filters.roleFilter}
                                onValueChange={handleRoleFilterChange}
                                disabled={loading}
                            >
                                <SelectTrigger className={!filters.roleFilter || filters.roleFilter === 'all' ? 'text-muted-foreground' : ''}>
                                    <SelectValue placeholder={t('allRoles')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allRoles')}</SelectItem>
                                    {availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {roleLabels[role] ?? formatRoleLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Feature Flag: Advanced Filters (Sort dropdown) */}
                        {userAdvancedFiltersEnabled && (
                            <div className="min-w-[200px] flex-[1]">
                                <label className="text-muted-foreground mb-2 block text-sm font-medium">{t('sortBy')}</label>
                                <Select value={sortSelection} onValueChange={handleSortChange} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('defaultSorting')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Reset Button */}
                        <div className="flex items-end">
                            <Button variant="ghost" size="icon" onClick={resetFilters} disabled={loading} aria-label="Reset filters">
                                <RefreshCcwDot className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {error && <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

                    {loading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">{t('noUsersFound')}</p>
                        </div>
                    ) : (
                        <>
                            <UserDataTable
                                users={users}
                                setUsers={setUsers}
                                loading={loading}
                                onEdit={openEditSheet}
                                onDelete={handleUserDeleted}
                                onView={handleViewUser}
                                pagination={pagination}
                                onPageChange={setPage}
                                onPageSizeChange={setLimit}
                                canEdit={permissions.can_edit_users}
                                canDelete={permissions.can_delete_users}
                            />
                        </>
                    )}
                </>
            )}

            <CreateUserSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} onUserCreated={handleUserCreated} />

            {selectedUser && <EditUserSheet open={editSheetOpen} onOpenChange={closeEditSheet} user={selectedUser} onUserUpdated={handleUserUpdated} />}
        </div>
    );
}

/**
 * User Page Component
 *
 * Wrapped with UserManagementProvider for Zustand store access.
 * This is the main export that provides scoped state management.
 */
export default UserManagementProvider(UserPage);
