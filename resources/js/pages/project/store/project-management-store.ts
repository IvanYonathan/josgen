import { createContextStore } from '@/stores/create-context-store';
import { Project, ProjectStatus } from '@/types/project/project';

export interface Division {
  id: number;
  name: string;
}

interface Filters {
  searchTerm: string;
  statusFilter: ProjectStatus | 'all';
  divisionId: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
  hasNextPage: boolean;
}

interface Store {
  projects: Project[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: Filters;
  searchInput: string;
  createMode: boolean;
  editMode: boolean;
  selectedProject: Project | null;
  availableDivisions: Division[];

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProjectInList: (project: Project) => void;
  removeProject: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setSearchInput: (searchInput: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setStatusFilter: (statusFilter: ProjectStatus | 'all') => void;
  setDivisionFilter: (divisionId: number | null) => void;
  resetFilters: () => void;
  openCreateMode: () => void;
  closeCreateMode: () => void;
  openEditMode: (project: Project) => void;
  closeEditMode: () => void;
  extractDivisions: () => void;
}

const initialState = {
  projects: [],
  loading: true,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: null,
    hasNextPage: false,
  },
  filters: {
    searchTerm: '',
    statusFilter: 'all' as 'all' | ProjectStatus,
    divisionId: null,
  },
  searchInput: '',
  createMode: false,
  editMode: false,
  selectedProject: null,
  availableDivisions: [],
};

export const [ProjectManagementProvider, useProjectManagementStore] = createContextStore<Store>(
  'ProjectManagement',
  (set, get) => ({
    ...initialState,

    setProjects: (projects) => {
      set({ projects });
      get().extractDivisions();
    },

    addProject: (project) =>
      set((state) => ({
        projects: [project, ...state.projects],
      })),

    updateProjectInList: (project) =>
      set((state) => ({
        projects: state.projects.map((p) => (p.id === project.id ? project : p)),
      })),

    removeProject: (id) =>
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    setPagination: (pagination) =>
      set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),

    setPage: (page) =>
      set((state) => ({
        pagination: { ...state.pagination, page },
      })),

    nextPage: () => {
      const { pagination } = get();
      if (pagination.hasNextPage) {
        set((state) => ({
          pagination: { ...state.pagination, page: state.pagination.page + 1 },
        }));
      }
    },

    prevPage: () => {
      const { pagination } = get();
      if (pagination.page > 1) {
        set((state) => ({
          pagination: { ...state.pagination, page: state.pagination.page - 1 },
        }));
      }
    },

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

    resetFilters: () =>
      set((state) => ({
        filters: {
          searchTerm: '',
          statusFilter: 'all',
          divisionId: null,
        },
        searchInput: '',
        pagination: { ...state.pagination, page: 1 },
      })),

    openCreateMode: () =>
      set({
        createMode: true,
        editMode: false,
        selectedProject: null,
      }),

    closeCreateMode: () =>
      set({
        createMode: false,
      }),

    openEditMode: (project) =>
      set({
        editMode: true,
        createMode: false,
        selectedProject: project,
      }),

    closeEditMode: () =>
      set({
        editMode: false,
        selectedProject: null,
      }),

    extractDivisions: () => {
      const { projects } = get();
      const divisionsMap = new Map<number, string>();

      projects.forEach((project) => {
        project.divisions?.forEach((division) => {
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
