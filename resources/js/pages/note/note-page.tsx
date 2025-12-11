import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, StickyNote, PlusCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { NoteManagementProvider, useNoteManagementStore } from './store/note-management-store';
import { listNotes } from '@/lib/api/note/list-notes';
import { NoteCard } from './components/note-card';
import { CreateNoteForm } from './components/create-note-form';
import { EditNoteForm } from './components/edit-note-form';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

function NotePageContent() {
  const { t } = useTranslation('note');
  const {
    notes,
    loading,
    error,
    pagination,
    filters,
    searchInput,
    createMode,
    editMode,
    viewMode,
    availableCategories,
    setNotes,
    setLoading,
    setError,
    setPagination,
    setSearchInput,
    setSearchTerm,
    setCategoryFilter,
    setPinnedFilter,
    resetFilters,
    openCreateMode,
  } = useNoteManagementStore();

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, filters.searchTerm, setSearchTerm]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: any = {};
      if (filters.searchTerm) {
        apiFilters.search = filters.searchTerm;
      }
      if (filters.categoryFilter) {
        apiFilters.category = filters.categoryFilter;
      }
      if (filters.pinnedFilter !== 'all') {
        apiFilters.is_pinned = filters.pinnedFilter === 'pinned';
      }

      const response = await listNotes({
        page: pagination.page,
        limit: pagination.limit,
        filters: apiFilters,
      });

      setNotes(response.notes);
      setPagination({
        total: response.pagination.total,
        hasNextPage: response.pagination.has_next_page,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('messages.load_error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [pagination.page, pagination.limit, filters.searchTerm, filters.categoryFilter, filters.pinnedFilter]);

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const pinnedCount = notes.filter(n => n.is_pinned).length;

  if (createMode) {
    return <CreateNoteForm />;
  }

  if (editMode) {
    return <EditNoteForm />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
            <Button onClick={openCreateMode}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('new_note')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-[3]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search_placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.categoryFilter || 'all'}
            onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}
          >
            <SelectTrigger wrapperClassName="w-full sm:w-[150px]">
              <SelectValue placeholder={t('filter_by_category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_categories')}</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.pinnedFilter}
            onValueChange={(value: 'all' | 'pinned' | 'unpinned') => setPinnedFilter(value)}
          >
            <SelectTrigger wrapperClassName="w-full sm:w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="pinned">{t('filters.pinned_only')}</SelectItem>
              <SelectItem value="unpinned">{t('filters.unpinned_only')}</SelectItem>
            </SelectContent>
          </Select>

          {(filters.searchTerm || filters.categoryFilter || filters.pinnedFilter !== 'all') && (
            <Button variant="outline" onClick={resetFilters}>
              {t('filters.clear_filters')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">{t('loading')}</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">{t('no_notes_found')}</p>
          <p className="text-muted-foreground mb-4">{t('no_notes_description')}</p>
          <Button onClick={openCreateMode}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('create_note')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('stats.showing', { count: notes.length })}
              {pinnedCount > 0 && ` • ${t('stats.pinned_count', { count: pinnedCount })}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export const NotePage = NoteManagementProvider(NotePageContent);
