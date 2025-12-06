import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowLeft, Loader2, Pin } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { UpdateNoteFormData, updateNoteSchema, cleanNoteFormData } from '../schemas/note-schemas';
import { updateNote } from '@/lib/api/note/update-note';
import { useNoteManagementStore } from '../store/note-management-store';
import { toast } from 'sonner';

export function EditNoteForm() {
  const { t } = useTranslation('note');
  const { selectedNote, closeEditMode, updateNoteInList } = useNoteManagementStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      id: selectedNote?.id || 0,
      title: selectedNote?.title || '',
      content: selectedNote?.content || '',
      category: selectedNote?.category || '',
      tags: (selectedNote?.tags || []) as string[],
      is_pinned: selectedNote?.is_pinned || false,
    },
  });

  useEffect(() => {
    if (selectedNote) {
      setCurrentTags(selectedNote.tags || []);
    }
  }, [selectedNote]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setCurrentTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(updatedTags);
    form.setValue('tags', updatedTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const cleanedData = cleanNoteFormData(data);
      const response = await updateNote(cleanedData as UpdateNoteFormData);
      updateNoteInList(response.note);
      toast.success(t('messages.update_success'));
      closeEditMode();
    } catch (error) {
      toast.error(t('messages.update_error'));
      console.error('Failed to update note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedNote) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeEditMode}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('edit.button.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('edit.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('edit.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              onClick={closeEditMode}
              disabled={isSubmitting}
            >
              {t('edit.button.cancel')}
            </Button> */}
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('edit.button.update')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('edit.form.title.label')}</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder={t('edit.form.title.placeholder')}
                  className="text-lg"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t('edit.form.content.label')}</Label>
                <Textarea
                  id="content"
                  {...form.register('content')}
                  placeholder={t('edit.form.content.placeholder')}
                  className="min-h-[400px] resize-y"
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('edit.form.category.label')}</Label>
                <Input
                  id="category"
                  {...form.register('category')}
                  placeholder={t('edit.form.category.placeholder')}
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">{t('edit.form.tags.label')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder={t('edit.form.tags.placeholder')}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <Checkbox
                  id="is_pinned"
                  checked={form.watch('is_pinned')}
                  onCheckedChange={(checked) => form.setValue('is_pinned', !!checked)}
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    <Label htmlFor="is_pinned" className="text-base cursor-pointer">
                      {t('edit.form.is_pinned.label')}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('create.form.is_pinned.description')}
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
