import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Briefcase, Users, Calendar, PlusCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// Placeholder types - replace with actual API types
interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  start_date?: string;
  end_date?: string;
  team_members_count: number;
  division_name?: string;
}

interface ProjectsResponse {
  projects: Project[];
  total: number;
}

export function ProjectPage() {
  const { t } = useTranslation('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when project API is implemented
      // const response = await listProjects();
      // setProjects(response.projects);

      // Mock data for now
      const mockProjects: Project[] = [
        {
          id: 1,
          name: 'Website Redesign',
          description: 'Complete overhaul of the company website with modern design and improved UX',
          status: 'in_progress',
          progress: 65,
          start_date: '2024-03-01',
          end_date: '2024-06-30',
          team_members_count: 5,
          division_name: 'Engineering'
        },
        {
          id: 2,
          name: 'Marketing Campaign Q2',
          description: 'Launch comprehensive marketing campaign for Q2 product releases',
          status: 'planning',
          progress: 20,
          start_date: '2024-04-15',
          end_date: '2024-07-15',
          team_members_count: 3,
          division_name: 'Marketing'
        },
        {
          id: 3,
          name: 'Mobile App Development',
          description: 'Develop mobile application for iOS and Android platforms',
          status: 'completed',
          progress: 100,
          start_date: '2024-01-01',
          end_date: '2024-04-30',
          team_members_count: 8,
          division_name: 'Engineering'
        },
        {
          id: 4,
          name: 'Customer Support System',
          description: 'Implement new customer support ticketing system',
          status: 'on_hold',
          progress: 45,
          start_date: '2024-02-01',
          end_date: '2024-05-31',
          team_members_count: 4,
          division_name: 'Operations'
        }
      ];

      setProjects(mockProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Project
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
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="hover:text-primary transition-colors line-clamp-2">
                    {project.name}
                  </CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress
                    value={project.progress}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  {project.division_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{project.division_name} Division</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.team_members_count} team members</span>
                  </div>

                  {project.start_date && project.end_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* TODO: Add pagination when API supports it */}
      {projects.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {projects.length} projects
          </p>
        </div>
      )}
    </div>
  );
}