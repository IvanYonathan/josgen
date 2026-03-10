import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, SquarePen, PlusCircle, Trash2, CheckSquare } from 'lucide-react';
import { TodoItem, TodoList } from '@/types/todo-list/todo-list';


interface DivisionTodoListCardProps {
  list: TodoList;
  selectedItemIds: Set<number>;
  onItemSelectionToggle: (itemId: number) => void;
  onMarkCompletion?: (listId: number) => void;
  getPriorityColor: (priority: string) => string;
  onEditList?: (list: TodoList) => void;
  onAddTask?: (list: TodoList) => void;
  onEditTask?: (task: TodoItem) => void;
  onDeleteTask?: (task: TodoItem) => void;
}

export function DivisionTodoListCard({
  list,
  selectedItemIds,
  onItemSelectionToggle,
  onMarkCompletion,
  getPriorityColor,
  onEditList,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: Readonly<DivisionTodoListCardProps>) {

  const selectedItemsInList = (list.items || []).filter(item => selectedItemIds.has(item.id)).length;
  return (
    <Card key={list.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-1">{list.title}</CardTitle>
              <div className="flex items-center gap-1 mt-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {list.division?.name || 'Unknown Division'} Division
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {list.completed_items || 0}/{list.total_items || 0}
              </Badge>
              {onAddTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask(list)}
                  className="h-8 w-8 p-0"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
              {onEditList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditList(list)}
                  className="h-8 w-8 p-0"
                >
                  <SquarePen className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {selectedItemsInList > 0 && onMarkCompletion && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onMarkCompletion(list.id)}
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Mark Completion ({selectedItemsInList})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {(list.items || []).slice(0, 5).map(item => (
          <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
            <Checkbox
              checked={selectedItemIds.has(item.id) ? !item.completed : item.completed}
              onCheckedChange={() => onItemSelectionToggle(item.id)}
              className="mt-0.5"
              aria-label="Toggle task completion"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-medium line-clamp-1 flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
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
                {item.assigned_to && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{item.assigned_to.name}</span>
                  </div>
                )}
                {item.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEditTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTask(item)}
                  className="h-7 w-7 p-0"
                >
                  <SquarePen className="h-3 w-3" />
                </Button>
              )}
              {onDeleteTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTask(item)}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {(list.items || []).length > 5 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm">
              View {(list.items || []).length - 5} more items
            </Button>
          </div>
        )}

        {(list.items || []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items in this list
          </p>
        )}
      </CardContent>
    </Card>
  );
}
