import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ListTodo, CheckCircle2, User } from 'lucide-react';
import { TodoList } from '@/types/todo-list/todo-list';

interface DivisionTodoListCardProps {
  todoList: TodoList;
}

export function DivisionTodoListCard({ todoList }: Readonly<DivisionTodoListCardProps>) {
  const totalItems = todoList.total_items || 0;
  const completedItems = todoList.completed_items || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            {todoList.title}
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedItems}/{totalItems}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{completedItems} completed</span>
          </div>
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-blue-600" />
            <span>{totalItems - completedItems} remaining</span>
          </div>
        </div>

        {todoList.user && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Created by: <span className="font-medium">{todoList.user.name}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
