import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ListTodo, PlusCircle, RefreshCw, Calendar, User } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// Placeholder types - replace with actual API types
interface TodoItem {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface TodoList {
  id: number;
  title: string;
  description?: string;
  items: TodoItem[];
  total_items: number;
  completed_items: number;
}

interface TodoListsResponse {
  todo_lists: TodoList[];
  total: number;
}

export function PersonalTodoListPage() {
  const { t } = useTranslation('todolist');
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load todo lists from API
  const loadTodoLists = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when todo list API is implemented
      // const response = await listPersonalTodoLists();
      // setTodoLists(response.todo_lists);

      // Mock data for now
      const mockTodoLists: TodoList[] = [
        {
          id: 1,
          title: 'Daily Tasks',
          description: 'My daily routine and tasks',
          total_items: 5,
          completed_items: 2,
          items: [
            {
              id: 1,
              title: 'Review morning emails',
              completed: true,
              priority: 'medium',
              created_at: '2024-05-01'
            },
            {
              id: 2,
              title: 'Prepare presentation slides',
              description: 'For tomorrow\'s client meeting',
              completed: false,
              priority: 'high',
              due_date: '2024-05-15',
              created_at: '2024-05-01'
            },
            {
              id: 3,
              title: 'Call dentist for appointment',
              completed: false,
              priority: 'low',
              created_at: '2024-05-01'
            }
          ]
        },
        {
          id: 2,
          title: 'Project Goals',
          description: 'Long-term project objectives',
          total_items: 3,
          completed_items: 1,
          items: [
            {
              id: 4,
              title: 'Complete API documentation',
              completed: true,
              priority: 'high',
              created_at: '2024-04-28'
            },
            {
              id: 5,
              title: 'Implement user authentication',
              completed: false,
              priority: 'high',
              due_date: '2024-05-20',
              created_at: '2024-04-28'
            }
          ]
        }
      ];

      setTodoLists(mockTodoLists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todo lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodoLists();
  }, []);

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleTodo = async (listId: number, itemId: number) => {
    // TODO: Implement API call to toggle todo item
    setTodoLists(prev => prev.map(list => {
      if (list.id === listId) {
        const updatedItems = list.items.map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        const completedCount = updatedItems.filter(item => item.completed).length;
        return {
          ...list,
          items: updatedItems,
          completed_items: completedCount
        };
      }
      return list;
    }));
  };

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

        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create List
        </Button>
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
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first list
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {todoLists.map(list => (
            <Card key={list.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1">{list.title}</CardTitle>
                    {list.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {list.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {list.completed_items}/{list.total_items}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {list.items.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleTodo(list.id, item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-medium line-clamp-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </p>
                        <Badge size="sm" className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Personal</span>
                        </div>
                        {item.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {list.items.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm">
                      View {list.items.length - 5} more items
                    </Button>
                  </div>
                )}

                {list.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items in this list
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TODO: Add pagination when API supports it */}
      {todoLists.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {todoLists.length} lists
          </p>
        </div>
      )}
    </div>
  );
}