import { createContextStore } from '@/stores/create-context-store';
import { Note } from '@/types/note/note';

export type SortField = 'title' | 'category' | 'is_pinned' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
  hasNextPage: boolean;
}

interface Filters {
  searchTerm: string;
  categoryFilter: string;
  pinnedFilter: 'all' | 'pinned' | 'unpinned';
}

interface NoteManagementState {
  notes: Note[];
  loading: boolean;
  error: string | null;

  pagination: Pagination;

  filters: Filters;
  searchInput: string;

  createMode: boolean;
  editMode: boolean;
  viewMode: boolean;
  selectedNote: Note | null;

  availableCategories: string[];
}

interface NoteManagementActions {
  setNotes: (notes: Note[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNote: (note: Note) => void;
  updateNoteInList: (note: Note) => void;
  removeNote: (id: number) => void;

  setPagination: (pagination: Partial<Pagination>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  setFilters: (filters: Partial<Filters>) => void;
  setSearchInput: (searchInput: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setCategoryFilter: (category: string) => void;
  setPinnedFilter: (filter: 'all' | 'pinned' | 'unpinned') => void;
  resetFilters: () => void;

  openCreateMode: () => void;
  closeCreateMode: () => void;
  openEditMode: (note: Note) => void;
  closeEditMode: () => void;
  openViewMode: (note: Note) => void;
  closeViewMode: () => void;
  setSelectedNote: (note: Note | null) => void;

  setAvailableCategories: (categories: string[]) => void;
  extractCategories: () => void;
}

type NoteManagementStore = NoteManagementState & NoteManagementActions;

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 50,
  total: null,
  hasNextPage: false,
};

const DEFAULT_FILTERS: Filters = {
  searchTerm: '',
  categoryFilter: '',
  pinnedFilter: 'all',
};

export const [NoteManagementProvider, useNoteManagementStore] = createContextStore<NoteManagementStore>(
  'NoteManagement',
  (set, get) => ({
    notes: [],
    loading: true,
    error: null,

    pagination: DEFAULT_PAGINATION,

    filters: DEFAULT_FILTERS,
    searchInput: '',

    createMode: false,
    editMode: false,
    viewMode: false,
    selectedNote: null,

    availableCategories: [],

    setNotes: (notes) => {
      set({ notes });
      get().extractCategories();
    },
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    addNote: (note) => {
      set((state) => ({ notes: [note, ...state.notes] }));
      get().extractCategories();
    },

    updateNoteInList: (note) => {
      set((state) => ({
        notes: state.notes.map((n) => (n.id === note.id ? note : n)),
      }));
      get().extractCategories();
    },

    removeNote: (id) => {
      set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
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

    setCategoryFilter: (category) =>
      set((state) => ({
        filters: { ...state.filters, categoryFilter: category },
        pagination: { ...state.pagination, page: 1 },
      })),

    setPinnedFilter: (filter) =>
      set((state) => ({
        filters: { ...state.filters, pinnedFilter: filter },
        pagination: { ...state.pagination, page: 1 },
      })),

    resetFilters: () =>
      set({
        filters: DEFAULT_FILTERS,
        searchInput: '',
        pagination: DEFAULT_PAGINATION,
      }),

    openCreateMode: () => set({ createMode: true, editMode: false, viewMode: false, selectedNote: null }),
    closeCreateMode: () => set({ createMode: false }),

    openEditMode: (note) => set({ editMode: true, createMode: false, viewMode: false, selectedNote: note }),
    closeEditMode: () => set({ editMode: false, selectedNote: null }),

    openViewMode: (note) => set({ viewMode: true, createMode: false, editMode: false, selectedNote: note }),
    closeViewMode: () => set({ viewMode: false, selectedNote: null }),

    setSelectedNote: (note) => set({ selectedNote: note }),

    setAvailableCategories: (categories) => set({ availableCategories: categories }),

    extractCategories: () => {
      const { notes } = get();
      const categories = Array.from(
        new Set(notes.map((note) => note.category).filter((cat): cat is string => !!cat))
      ).sort();
      set({ availableCategories: categories });
    },
  })
);
