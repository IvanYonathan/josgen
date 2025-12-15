import { useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Briefcase, Users, Calendar, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { ProjectManagementProvider, useProjectManagementStore } from './store/project-management-store';
import { CreateProjectSheet } from './components/create-project-sheet';
import { EditProjectSheet } from './components/edit-project-sheet';
import { listProjects } from '@/lib/api/project/list-projects';
import { Project } from '@/types/project/project';
import { toast } from 'sonner';

function ProjectPageContent() {
  const {
    projects,
    loading,
    error,
    setProjects,
    setLoading,
    setError,
    createMode,
    editMode,
    openCreateMode,
    openEditMode,
    searchInput,
    setSearchInput,
    setSearchTerm,
    filters,
    setStatusFilter,
    pagination,
    setPagination,
  } = useProjectManagementStore();

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    loadProjects();
  }, [debouncedSearch, filters.statusFilter, pagination.page]);

  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listProjects({
        page: pagination.page,
        limit: pagination.limit,
        filters: {
          search: filters.searchTerm,
          status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
        },
      });

      setProjects(response.projects);
      setPagination({
        total: response.pagination.total,
        hasNextPage: response.pagination.has_next_page,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (project.can_edit) {
      openEditMode(project);
    } else {
      toast.info('You can only view this project');
      openEditMode(project);
    }
  };

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

  const formatStatus = (status: Project['status']) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (createMode) return <CreateProjectSheet />;
  if (editMode) return <EditProjectSheet />;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
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

        <Button onClick={openCreateMode}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:flex-[10]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filters.statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
      </div>

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
          <p className="text-muted-foreground mb-4">
            {filters.searchTerm || filters.statusFilter !== 'all'
              ? 'No projects found matching your filters'
              : 'No projects found'}
          </p>
          <Button variant="outline" onClick={openCreateMode}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProjectClick(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="hover:text-primary transition-colors line-clamp-2 text-lg">
                      {project.name}
                    </CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {formatStatus(project.status)}
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
                      <span className="text-muted-foreground">Progress</span>
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
                        {project.members_count || 0} member{project.members_count !== 1 ? 's' : ''}
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
                    {project.can_edit ? 'Edit Project' : 'View Details'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {pagination.total !== null && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {projects.length} of {pagination.total} projects
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const ProjectPage = ProjectManagementProvider(ProjectPageContent);
