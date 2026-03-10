import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { rejectTreasury } from '@/lib/api/treasury';

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: TreasuryRequest | null;
    onSuccess: () => void;
}

export function RejectDialog({ open, onOpenChange, request, onSuccess }: Readonly<RejectDialogProps>) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const { t } = useTranslation('treasury');

    const handleReject = async () => {
        if (!request || !reason.trim()) {
            toast.error(new Error(t('toast.provideReason')), { title: t('toast.validationError') });
            return;
        }

        const { id } = toast.loading({ title: t('toast.rejecting') });
        try {
            setLoading(true);
            await rejectTreasury({ id: request.id, notes: reason });
            toast.success({ itemID: id, title: t('toast.rejected') });
            onOpenChange(false);
            setReason('');
            onSuccess();
        } catch (err) {
            toast.error(err, { itemID: id, title: t('toast.failedReject') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{t('dialogs.rejectTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('dialogs.rejectDesc', { title: request?.title })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Textarea
                        placeholder={t('dialogs.rejectPlaceholder')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                    />

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t('form.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={loading || !reason.trim()}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('dialogs.rejectRequest')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
