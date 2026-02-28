import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Users, CheckSquare } from 'lucide-react';
import { Project } from '@/types/project/project';
import { format } from 'date-fns';

interface DivisionProjectCardProps {
  project: Project;
}

export function DivisionProjectCard({ project }: Readonly<DivisionProjectCardProps>) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge className={getStatusColor(project.status)}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(project.start_date), 'MMM d, yyyy')}
              {project.end_date && ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}`}
            </span>
          </div>

          {project.members_count !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{project.members_count} member(s)</span>
            </div>
          )}

          {project.tasks_count !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span>{project.tasks_count} task(s)</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {project.manager && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Manager: <span className="font-medium">{project.manager.name}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
