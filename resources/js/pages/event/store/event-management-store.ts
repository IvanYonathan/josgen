import { createContextStore } from '@/stores/create-context-store';
import { Event } from '@/types/event/event';

export type SortField = 'title' | 'start_date' | 'end_date' | 'status' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
  hasNextPage: boolean;
}

interface Filters {
  searchTerm: string;
  statusFilter: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  divisionId: number | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface EventManagementState {
  events: Event[];
  loading: boolean;
  error: string | null;

  pagination: Pagination;

  filters: Filters;
  searchInput: string;

  createMode: boolean;
  editMode: boolean;
  viewMode: boolean;
  selectedEvent: Event | null;

  availableDivisions: Array<{ id: number; name: string }>;
}

interface EventManagementActions {
  setEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addEvent: (event: Event) => void;
  updateEventInList: (event: Event) => void;
  removeEvent: (id: number) => void;

  setPagination: (pagination: Partial<Pagination>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  setFilters: (filters: Partial<Filters>) => void;
  setSearchInput: (searchInput: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setStatusFilter: (status: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled') => void;
  setDivisionFilter: (divisionId: number | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  resetFilters: () => void;

  openCreateMode: () => void;
  closeCreateMode: () => void;
  openEditMode: (event: Event) => void;
  closeEditMode: () => void;
  openViewMode: (event: Event) => void;
  closeViewMode: () => void;
  setSelectedEvent: (event: Event | null) => void;

  setAvailableDivisions: (divisions: Array<{ id: number; name: string }>) => void;
  extractDivisions: () => void;
}

type EventManagementStore = EventManagementState & EventManagementActions;

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 50,
  total: null,
  hasNextPage: false,
};

const DEFAULT_FILTERS: Filters = {
  searchTerm: '',
  statusFilter: 'all',
  divisionId: null,
  dateRange: {
    start: null,
    end: null,
  },
};

export const [EventManagementProvider, useEventManagementStore] = createContextStore<EventManagementStore>(
  'EventManagement',
  (set, get) => ({
    events: [],
    loading: true,
    error: null,

    pagination: DEFAULT_PAGINATION,

    filters: DEFAULT_FILTERS,
    searchInput: '',

    createMode: false,
    editMode: false,
    viewMode: false,
    selectedEvent: null,

    availableDivisions: [],

    setEvents: (events) => {
      set({ events });
      get().extractDivisions();
    },
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    addEvent: (event) => {
      set((state) => ({ events: [event, ...state.events] }));
      get().extractDivisions();
    },

    updateEventInList: (event) => {
      set((state) => ({
        events: state.events.map((e) => (e.id === event.id ? event : e)),
      }));
      get().extractDivisions();
    },

    removeEvent: (id) => {
      set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    },

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
        set((state) => ({
          pagination: { ...state.pagination, page: pagination.page + 1 },
        }));
      }
    },

    previousPage: () => {
      const { pagination } = get();
      if (pagination.page > 1) {
        set((state) => ({
          pagination: { ...state.pagination, page: pagination.page - 1 },
        }));
      }
    },

    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
      })),

    setSearchInput: (searchInput) => set({ searchInput }),

    setSearchTerm: (searchTerm) =>
      set((state) => ({
        filters: { ...state.filters, searchTerm },
        pagination: { ...state.pagination, page: 1 },
      })),

    setStatusFilter: (statusFilter) =>
      set((state) => ({
        filters: { ...state.filters, statusFilter },
        pagination: { ...state.pagination, page: 1 },
      })),

    setDivisionFilter: (divisionId) =>
      set((state) => ({
        filters: { ...state.filters, divisionId },
        pagination: { ...state.pagination, page: 1 },
      })),

    setDateRange: (start, end) =>
      set((state) => ({
        filters: { ...state.filters, dateRange: { start, end } },
        pagination: { ...state.pagination, page: 1 },
      })),

    resetFilters: () =>
      set({
        filters: DEFAULT_FILTERS,
        searchInput: '',
        pagination: DEFAULT_PAGINATION,
      }),

    openCreateMode: () => set({ createMode: true, editMode: false, viewMode: false, selectedEvent: null }),
    closeCreateMode: () => set({ createMode: false }),

    openEditMode: (event) => set({ editMode: true, createMode: false, viewMode: false, selectedEvent: event }),
    closeEditMode: () => set({ editMode: false, selectedEvent: null }),

    openViewMode: (event) => set({ viewMode: true, createMode: false, editMode: false, selectedEvent: event }),
    closeViewMode: () => set({ viewMode: false, selectedEvent: null }),

    setSelectedEvent: (event) => set({ selectedEvent: event }),

    setAvailableDivisions: (divisions) => set({ availableDivisions: divisions }),

    extractDivisions: () => {
      const { events } = get();
      const divisionsMap = new Map<number, string>();

      events.forEach((event) => {
        event.divisions?.forEach((division) => {
          divisionsMap.set(division.id, division.name);
        });
      });

      const divisions = Array.from(divisionsMap.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

      set({ availableDivisions: divisions });
    },
  })
);
