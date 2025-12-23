import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectName: string;
}

export function DeleteProjectDialog({ open, onOpenChange, onConfirm, projectName }: DeleteProjectDialogProps) {
  const { t } = useTranslation('project');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('dialog.deleteProject.title')}</DialogTitle>
        </DialogHeader>
        <p>{t.rich('confirm_delete_project', { projectName })}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialog.deleteProject.cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t('dialog.deleteProject.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
