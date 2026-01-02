import { createContextStore } from '@/stores/create-context-store';
import { TodoItem, TodoList } from '@/types/todo-list/todo-list';


export type SortField = 'title' | 'type' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
  hasNextPage: boolean;
}

interface Filters {
  searchTerm: string;
  typeFilter: 'all' | 'personal' | 'division';
  divisionFilter: number | null;
}

interface TodoListManagementState {
  todoLists: TodoList[];
  loading: boolean;
  error: string | null;

  pagination: Pagination;

  filters: Filters;
  searchInput: string;

  createMode: boolean;
  editMode: boolean;
  viewMode: boolean;
  selectedTodoList: TodoList | null;

  selectedItemIds: Set<number>;
  bulkToggleLoading: boolean;

  createItemMode: boolean;
  editItemMode: boolean;
  selectedItem: TodoItem | null;
}

interface TodoListManagementActions {
  setTodoLists: (todoLists: TodoList[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTodoList: (todoList: TodoList) => void;
  updateTodoListInList: (todoList: TodoList) => void;
  removeTodoList: (id: number) => void;

  addItemToList: (listId: number, item: TodoItem) => void;
  updateItemInList: (listId: number, item: TodoItem) => void;
  removeItemFromList: (listId: number, itemId: number) => void;
  updateItemsInList: (listId: number, items: TodoItem[]) => void;

  setPagination: (pagination: Partial<Pagination>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;

  setFilters: (filters: Partial<Filters>) => void;
  setSearchInput: (searchInput: string) => void;
  setSearchTerm: (searchTerm: string) => void;
  setTypeFilter: (type: 'all' | 'personal' | 'division') => void;
  setDivisionFilter: (divisionId: number | null) => void;
  resetFilters: () => void;

  openCreateMode: () => void;
  closeCreateMode: () => void;
  openEditMode: (todoList: TodoList) => void;
  closeEditMode: () => void;
  openViewMode: (todoList: TodoList) => void;
  closeViewMode: () => void;
  setSelectedTodoList: (todoList: TodoList | null) => void;

  toggleItemSelection: (itemId: number) => void;
  selectAllItems: (itemIds: number[]) => void;
  clearItemSelection: () => void;
  setBulkToggleLoading: (loading: boolean) => void;

  openCreateItemMode: () => void;
  closeCreateItemMode: () => void;
  openEditItemMode: (item: TodoItem) => void;
  closeEditItemMode: () => void;
  setSelectedItem: (item: TodoItem | null) => void;
}

type TodoListManagementStore = TodoListManagementState & TodoListManagementActions;

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 50,
  total: null,
  hasNextPage: false,
};

const DEFAULT_FILTERS: Filters = {
  searchTerm: '',
  typeFilter: 'all',
  divisionFilter: null,
};

export const [TodoListManagementProvider, useTodoListManagementStore] = createContextStore<TodoListManagementStore>(
  'TodoListManagement',
  (set, get) => ({
    todoLists: [],
    loading: true,
    error: null,

    pagination: DEFAULT_PAGINATION,

    filters: DEFAULT_FILTERS,
    searchInput: '',

    createMode: false,
    editMode: false,
    viewMode: false,
    selectedTodoList: null,

    selectedItemIds: new Set(),
    bulkToggleLoading: false,

    createItemMode: false,
    editItemMode: false,
    selectedItem: null,

    setTodoLists: (todoLists) => set({ todoLists }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    addTodoList: (todoList) => {
      set((state) => ({ todoLists: [todoList, ...state.todoLists] }));
    },

    updateTodoListInList: (todoList) => {
      set((state) => ({
        todoLists: state.todoLists.map((tl) => (tl.id === todoList.id ? todoList : tl)),
      }));
    },

    removeTodoList: (id) => {
      set((state) => ({ todoLists: state.todoLists.filter((tl) => tl.id !== id) }));
    },

    addItemToList: (listId, item) => {
      set((state) => ({
        todoLists: state.todoLists.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: [...(list.items || []), item],
              total_items: (list.total_items || 0) + 1,
            };
          }
          return list;
        }),
      }));
    },

    updateItemInList: (listId, item) => {
      set((state) => ({
        todoLists: state.todoLists.map((list) => {
          if (list.id === listId) {
            const updatedItems = (list.items || []).map((i) => (i.id === item.id ? item : i));
            return {
              ...list,
              items: updatedItems,
              completed_items: updatedItems.filter((i) => i.completed).length,
            };
          }
          return list;
        }),
      }));
    },

    removeItemFromList: (listId, itemId) => {
      set((state) => ({
        todoLists: state.todoLists.map((list) => {
          if (list.id === listId) {
            const updatedItems = (list.items || []).filter((i) => i.id !== itemId);
            return {
              ...list,
              items: updatedItems,
              total_items: (list.total_items || 0) - 1,
              completed_items: updatedItems.filter((i) => i.completed).length,
            };
          }
          return list;
        }),
      }));
    },

    updateItemsInList: (listId, items) => {
      set((state) => ({
        todoLists: state.todoLists.map((list) => {
          if (list.id === listId) {
            const currentItems = list.items || [];
            const updatedItems = currentItems.map((currentItem) => {
              const updatedItem = items.find((item) => item.id === currentItem.id);
              return updatedItem || currentItem;
            });
            return {
              ...list,
              items: updatedItems,
              completed_items: updatedItems.filter((i) => i.completed).length,
            };
          }
          return list;
        }),
      }));
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

    setTypeFilter: (type) =>
      set((state) => ({
        filters: { ...state.filters, typeFilter: type },
        pagination: { ...state.pagination, page: 1 },
      })),

    setDivisionFilter: (divisionId) =>
      set((state) => ({
        filters: { ...state.filters, divisionFilter: divisionId },
        pagination: { ...state.pagination, page: 1 },
      })),

    resetFilters: () =>
      set({
        filters: DEFAULT_FILTERS,
        searchInput: '',
        pagination: DEFAULT_PAGINATION,
      }),

    openCreateMode: () => set({ createMode: true, editMode: false, viewMode: false, selectedTodoList: null }),
    closeCreateMode: () => set({ createMode: false }),

    openEditMode: (todoList) => set({ editMode: true, createMode: false, viewMode: false, selectedTodoList: todoList }),
    closeEditMode: () => set({ editMode: false, selectedTodoList: null }),

    openViewMode: (todoList) => set({ viewMode: true, createMode: false, editMode: false, selectedTodoList: todoList }),
    closeViewMode: () => set({ viewMode: false, selectedTodoList: null }),

    setSelectedTodoList: (todoList) => set({ selectedTodoList: todoList }),

    toggleItemSelection: (itemId) => {
      const { selectedItemIds } = get();
      const newSelection = new Set(selectedItemIds);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      set({ selectedItemIds: newSelection });
    },

    selectAllItems: (itemIds) => {
      set({ selectedItemIds: new Set(itemIds) });
    },

    clearItemSelection: () => {
      set({ selectedItemIds: new Set() });
    },

    setBulkToggleLoading: (loading) => set({ bulkToggleLoading: loading }),

    openCreateItemMode: () => set({ createItemMode: true, editItemMode: false, selectedItem: null }),
    closeCreateItemMode: () => set({ createItemMode: false }),

    openEditItemMode: (item) => set({ editItemMode: true, createItemMode: false, selectedItem: item }),
    closeEditItemMode: () => set({ editItemMode: false, selectedItem: null }),

    setSelectedItem: (item) => set({ selectedItem: item }),
  })
);
