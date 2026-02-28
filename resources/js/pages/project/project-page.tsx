import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Briefcase, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/contexts/auth-context';
import { ProjectManagementProvider, useProjectManagementStore } from './store/project-management-store';
import { CreateProjectSheet } from './components/create-project-sheet';
import { EditProjectSheet } from './components/edit-project-sheet';
import { listProjects } from '@/lib/api/project/list-projects';
import { Project } from '@/types/project/project';
import { useToast } from '@/hooks/use-toast';
import { ProjectCard } from './components/project-card';

function ProjectPageContent() {
  const { toast } = useToast();
  const { t } = useTranslation('project');
  const { permissions } = useAuth();
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
      const errorMessage = err instanceof Error ? err.message : t('failed_to_load_projects');
      setError(errorMessage);
      toast.error(err, { title: t('failed_to_load_projects') });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    if (project.can_edit) {
      openEditMode(project);
    } else {
      toast.warning({ title: t('view_only') });
      openEditMode(project);
    }
  };

  if (createMode) return <CreateProjectSheet />;
  if (editMode) return <EditProjectSheet />;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {permissions.can_create_projects && (
          <Button onClick={openCreateMode}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('create_project')}
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 sm:flex-[10]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_projects_placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filters.statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
              <SelectValue placeholder={t('filter_by_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_status')}</SelectItem>
              <SelectItem value="planning">{t('planning')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="on_hold">{t('on_hold')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
              <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
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
              ? t('noProjectsFoundMatchingFilters')
              : t('noProjectsFound')}
          </p>
          {permissions.can_create_projects && (
            <Button variant="outline" onClick={openCreateMode}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('create_first_project')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleProjectClick}
              />
            ))}
          </div>

          {pagination.total !== null && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t('showing_projects', { shown: projects.length, total: pagination.total })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const ProjectPage = ProjectManagementProvider(ProjectPageContent);
