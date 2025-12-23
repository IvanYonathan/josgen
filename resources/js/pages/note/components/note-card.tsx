import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pin, Tag, Calendar, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Note } from '@/types/note/note';
import { useNoteManagementStore } from '../store/note-management-store';
import { deleteNote } from '@/lib/api/note/delete-note';
import { updateNote } from '@/lib/api/note/update-note';
import { toast } from 'sonner';

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const { t } = useTranslation('note');
  const { openEditMode, removeNote, updateNoteInList } = useNoteManagementStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);

  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = stripHtmlTags(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // const getCategoryColor = (category?: string | null) => {
  //   if (!category) return 'bg-gray-100 text-gray-800';

  //   const colors: Record<string, string> = {
  //     'Work': 'bg-blue-100 text-blue-800',
  //     'Personal': 'bg-green-100 text-green-800',
  //     'Ideas': 'bg-purple-100 text-purple-800',
  //     'Tasks': 'bg-yellow-100 text-yellow-800',
  //     'Reference': 'bg-pink-100 text-pink-800',
  //   };

  //   return colors[category] || 'bg-gray-100 text-gray-800';
  // };

  const handleEdit = () => {
    openEditMode(note);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteNote({ id: note.id });
      removeNote(note.id);
      toast.success(t('messages.delete_success'));
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t('messages.delete_error'));
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsTogglingPin(true);
      const response = await updateNote({
        id: note.id,
        is_pinned: !note.is_pinned,
      });
      updateNoteInList(response.note);
      toast.success(
        note.is_pinned ? t('messages.update_success') : t('messages.update_success')
      );
    } catch (error) {
      toast.error(t('messages.update_error'));
      console.error('Failed to toggle pin:', error);
    } finally {
      setIsTogglingPin(false);
    }
  };

  return (
    <>
      <Card
        className={`overflow-hidden hover:shadow-md transition-all cursor-pointer ${
          note.is_pinned ? 'ring-2 ring-yellow-200 bg-yellow-50/50' : ''
        }`}
        onClick={handleEdit}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="hover:text-primary transition-colors line-clamp-2 text-base flex items-start gap-2">
              {note.is_pinned && <Pin className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />}
              <span>{note.title}</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {note.category && (
                <Badge variant="secondary">
                  {note.category}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleTogglePin(); }}
                    disabled={isTogglingPin}
                  >
                    {isTogglingPin ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pin className="h-4 w-4 mr-2" />
                    )}
                    {note.is_pinned ? t('unpin_note') : t('pin_note')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete_note')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-4">
            {truncateContent(note.content)}
          </p>

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(note.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('delete.confirm_message', { noteTitle: note.title }, {
                components: {
                  bold: <strong className="font-semibold" />
                }
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('delete.button_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete.button_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
