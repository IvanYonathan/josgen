import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Users, Calendar } from 'lucide-react';
import { Project } from '@/types/project/project';
import { useTranslation } from '@/hooks/use-translation';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { t } = useTranslation('project');

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="hover:text-primary transition-colors line-clamp-2 text-lg">
            {project.name}
          </CardTitle>
          <Badge className={getStatusColor(project.status)}>
            {t(project.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-muted-foreground line-clamp-3 text-sm">
            {project.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="space-y-2">
          {project.divisions && project.divisions.length > 0 && (
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {project.divisions.map((division) => (
                  <Badge key={division.id} variant="outline" className="text-xs">
                    {division.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t('members_count', { count: project.members_count || 0 })}
            </span>
          </div>

          {project.start_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {new Date(project.start_date).toLocaleDateString()}
                {project.end_date &&
                  ` - ${new Date(project.end_date).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button variant="outline" className="w-full">
          {project.can_edit ? t('edit_project') : t('view_details')}
        </Button>
      </CardFooter>
    </Card>
  );
}
