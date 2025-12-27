import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { rejectTreasury } from '@/lib/api/treasury';

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: TreasuryRequest | null;
    onSuccess: () => void;
}

export function RejectDialog({ open, onOpenChange, request, onSuccess }: RejectDialogProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    const handleReject = async () => {
        if (!request || !reason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            setLoading(true);
            await rejectTreasury({ id: request.id, notes: reason });
            toast.success('Request rejected successfully');
            onOpenChange(false);
            setReason('');
            onSuccess();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Reject Request</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting "{request?.title}".
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Textarea
                        placeholder="Enter reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                    />

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={loading || !reason.trim()}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Reject Request
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
