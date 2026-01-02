import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ListTodo, PlusCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { TodoListManagementProvider, useTodoListManagementStore } from '../store/todo-list-management-store';
import { listTodoLists } from '@/lib/api/todo-list/list-todo-lists';
import { toggleTodoItem } from '@/lib/api/todo-list/items/toggle-todo-item';
import { PersonalTodoListCard } from '../components/personal-todolist-card';
import { CreateTodoListForm } from '../components/create-todolist-form';
import { EditTodoListForm } from '../components/edit-todolist-form';
import { AddTodoListTaskDialog } from '../components/add-todolist-task-dialog';
import { EditTodoListTaskDialog } from '../components/edit-todolist-task-dialog';
import { DeleteTodoListTaskDialog } from '../components/delete-todolist-task-dialog';
import { TodoItem, TodoList } from '@/types/todo-list/todo-list';

type ViewMode = 'list' | 'create' | 'edit';

function PersonalTodoListPageContent() {
  const { t } = useTranslation('todolist');
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTodoList, setSelectedTodoList] = useState<TodoList | null>(null);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoItem | null>(null);
  const [currentTaskList, setCurrentTaskList] = useState<TodoList | null>(null);

  const {
    todoLists,
    loading,
    error,
    searchInput,
    filters,
    pagination,
    selectedItemIds,
    setTodoLists,
    setLoading,
    setError,
    setSearchTerm,
    setPagination,
    toggleItemSelection,
    updateItemsInList,
  } = useTodoListManagementStore();

  const debouncedSearch = useDebounce(searchInput, 300);

  const loadTodoLists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listTodoLists({
        type: 'personal',
        page: pagination.page,
        limit: pagination.limit,
        filters: filters.searchTerm ? { search: filters.searchTerm } : undefined,
      });

      setTodoLists(response.todo_lists);
      setPagination({
        total: response.pagination?.total || 0,
        hasNextPage: response.pagination?.has_next_page || false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load todo lists';
      setError(errorMsg);
      toast.error({ title: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodoLists();
  }, [debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch]);

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleItemSelectionToggle = (itemId: number) => {
    toggleItemSelection(itemId);
  };

  const handleMarkCompletion = async (listId: number) => {
    const list = todoLists.find((l: TodoList) => l.id === listId);
    if (!list) return;

    const selectedItems = (list.items || []).filter((item: TodoItem) => selectedItemIds.has(item.id));

    if (selectedItems.length === 0) return;

    // Determine if we should mark as complete or incomplete
    // If ALL selected items are completed, mark as incomplete; otherwise mark as complete
    const allCompleted = selectedItems.every((item: TodoItem) => item.completed);
    const newCompletedState = !allCompleted;

    try {
      const result = await toggleTodoItem({
        ids: selectedItems.map((item: TodoItem) => item.id),
        completed: newCompletedState,
      });

      const updatedItems = Array.isArray(result) ? result : [result];
      updateItemsInList(listId, updatedItems);

      selectedItems.forEach((item: TodoItem) => toggleItemSelection(item.id));

      const action = newCompletedState ? 'completed' : 'uncompleted';
      toast.success({ title: `${updatedItems.length} task(s) marked as ${action}` });
    } catch (err) {
      toast.error({ title: err instanceof Error ? err.message : 'Failed to toggle tasks' });
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTodoList(null);
    loadTodoLists();
  };

  const handleEditList = (list: TodoList) => {
    setSelectedTodoList(list);
    setViewMode('edit');
  };

  const handleAddTask = (list: TodoList) => {
    setCurrentTaskList(list);
    setAddTaskDialogOpen(true);
  };

  const handleEditTask = (task: TodoItem) => {
    setSelectedTask(task);
    const list = todoLists.find((l: TodoList) => l.items?.some((i: TodoItem) => i.id === task.id));
    setCurrentTaskList(list || null);
    setEditTaskDialogOpen(true);
  };

  const handleDeleteTask = (task: TodoItem) => {
    setSelectedTask(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleTaskOperationSuccess = () => {
    loadTodoLists();
  };

  if (viewMode === 'create') {
    return <CreateTodoListForm type="personal" onBack={handleBackToList} />;
  }

  if (viewMode === 'edit') {
    return <EditTodoListForm todoList={selectedTodoList} onBack={handleBackToList} />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Personal To-Do Lists</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTodoLists}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setViewMode('create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create List
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : todoLists.length === 0 ? (
        <div className="text-center py-8">
          <ListTodo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No todo lists found</p>
          <Button variant="outline" onClick={() => setViewMode('create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first list
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {todoLists.map(list => (
            <PersonalTodoListCard
              key={list.id}
              list={list}
              selectedItemIds={selectedItemIds}
              onItemSelectionToggle={handleItemSelectionToggle}
              onMarkCompletion={handleMarkCompletion}
              getPriorityColor={getPriorityColor}
              onEditList={handleEditList}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {todoLists.length > 0 && pagination.total !== null && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {todoLists.length} of {pagination.total} lists
          </p>
        </div>
      )}

      <AddTodoListTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        todoList={currentTaskList}
        onSuccess={handleTaskOperationSuccess}
      />
      <EditTodoListTaskDialog
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        task={selectedTask}
        todoList={currentTaskList}
        onSuccess={handleTaskOperationSuccess}
      />
      <DeleteTodoListTaskDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
        task={selectedTask}
        onSuccess={handleTaskOperationSuccess}
      />
    </div>
  );
}

// Wrap with provider
export const PersonalTodoListPage = TodoListManagementProvider(PersonalTodoListPageContent);