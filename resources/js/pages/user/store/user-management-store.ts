import { createContextStore } from '@/stores/create-context-store';
import { User, UserRole } from '@/types/user/user';
import { SortingState } from '@tanstack/react-table';

/**
 * User Management Store
 *
 * Centralized state management for the user management page.
 * Uses Zustand + React Context pattern for scoped state.
 */

export type SortField = 'created_at' | 'updated_at' | 'name' | 'email';
export type SortDirection = 'asc' | 'desc';

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
  hasNextPage: boolean;
}

interface Filters {
  searchTerm: string;
  roleFilter: 'all' | UserRole;
}

interface UserManagementState {
  // User data
  users: User[];
  loading: boolean;
  error: string | null;

  // Pagination
  pagination: Pagination;

  // Filters
  filters: Filters;
  searchInput: string; // Separate for debouncing

  // Sorting
  sorting: SortingState | null;

  // UI state
  createSheetOpen: boolean;
  editSheetOpen: boolean;
  selectedUser: User | null;
  detailUser: User | null;

  // Role metadata
  roleLabels: Record<string, string>;
  availableRoles: UserRole[];
}

interface UserManagementActions {
  // User data actions
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Pagination actions
  setPagination: (pagination: Partial<Pagination>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  // Filter actions
  setFilters: (filters: Partial<Filters>) => void;
  setSearchInput: (searchInput: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setRoleFilter: (roleFilter: 'all' | UserRole) => void;

  // Sorting actions
  setSorting: (sorting: SortingState | null) => void;
  toggleSorting: (field: SortField) => void;

  // UI actions
  setCreateSheetOpen: (open: boolean) => void;
  setEditSheetOpen: (open: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  setDetailUser: (user: User | null) => void;

  // Role metadata actions
  setRoleLabels: (labels: Record<string, string>) => void;
  setAvailableRoles: (roles: UserRole[]) => void;

  // Composite actions
  resetFilters: () => void;
  openEditSheet: (user: User) => void;
  closeEditSheet: () => void;
  openDetailView: (user: User) => void;
  closeDetailView: () => void;
}

type UserManagementStore = UserManagementState & UserManagementActions;

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: null,
  hasNextPage: false,
};

const DEFAULT_FILTERS: Filters = {
  searchTerm: '',
  roleFilter: 'all',
};

/**
 * Create the User Management store with Context wrapper
 */
export const [UserManagementProvider, useUserManagementStore] = createContextStore<UserManagementStore>(
  'UserManagement',
  (set, get) => ({
    // Initial state
    users: [],
    loading: true,
    error: null,

    pagination: DEFAULT_PAGINATION,

    filters: DEFAULT_FILTERS,
    searchInput: '',

    sorting: null,

    createSheetOpen: false,
    editSheetOpen: false,
    selectedUser: null,
    detailUser: null,

    roleLabels: {},
    availableRoles: [],

    // Actions
    setUsers: (users) => set({ users }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Pagination actions
    setPagination: (pagination) =>
      set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),

    setPage: (page) =>
      set((state) => ({
        pagination: { ...state.pagination, page },
      })),

    setLimit: (limit) =>
      set((state) => ({
        pagination: { ...state.pagination, limit, page: 1 },
      })),

    nextPage: () => {
      const { pagination } = get();
      if (pagination.hasNextPage) {
        set({
          pagination: { ...pagination, page: pagination.page + 1 },
        });
      }
    },

    previousPage: () => {
      const { pagination } = get();
      if (pagination.page > 1) {
        set({
          pagination: { ...pagination, page: pagination.page - 1 },
        });
      }
    },

    // Filter actions
    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 },
      })),

    setSearchInput: (searchInput) => set({ searchInput }),

    setSearchTerm: (searchTerm) =>
      set((state) => ({
        filters: { ...state.filters, searchTerm },
        pagination: { ...state.pagination, page: 1 },
      })),

    setRoleFilter: (roleFilter) =>
      set((state) => ({
        filters: { ...state.filters, roleFilter },
        pagination: { ...state.pagination, page: 1 },
      })),

    // Sorting actions
    setSorting: (sorting) =>
      set((state) => ({
        sorting,
        pagination: { ...state.pagination, page: 1 },
      })),

    toggleSorting: (field) => {
      const { sorting } = get();

      // If same field, toggle direction
      if (sorting && sorting.length > 0 && sorting[0].id === field) {
        const newDesc = !sorting[0].desc;
        set((state) => ({
          sorting: [{ id: field, desc: newDesc }],
          pagination: { ...state.pagination, page: 1 },
        }));
      } else {
        // New field, default to ascending
        set((state) => ({
          sorting: [{ id: field, desc: false }],
          pagination: { ...state.pagination, page: 1 },
        }));
      }
    },

    // UI actions
    setCreateSheetOpen: (open) => set({ createSheetOpen: open }),
    setEditSheetOpen: (open) => set({ editSheetOpen: open }),
    setSelectedUser: (user) => set({ selectedUser: user }),
    setDetailUser: (user) => set({ detailUser: user }),

    // Role metadata actions
    setRoleLabels: (labels) => set({ roleLabels: labels }),
    setAvailableRoles: (roles) => set({ availableRoles: roles }),

    // Composite actions
    resetFilters: () =>
      set({
        filters: DEFAULT_FILTERS,
        searchInput: '',
        sorting: null,
        pagination: DEFAULT_PAGINATION,
      }),

    openEditSheet: (user) =>
      set({
        selectedUser: user,
        editSheetOpen: true,
      }),

    closeEditSheet: () =>
      set({
        selectedUser: null,
        editSheetOpen: false,
      }),

    openDetailView: (user) => set({ detailUser: user }),

    closeDetailView: () => set({ detailUser: null }),
  })
);
