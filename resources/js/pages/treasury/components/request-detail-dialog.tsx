import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Building,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    Download,
} from 'lucide-react';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { formatCurrency, getStatusBadgeClass } from './request-card';
import { formatDate } from '@/utils/date';
import { useTranslation } from '@/hooks/use-translation';

interface RequestDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: TreasuryRequest | null;
    hideAmounts?: boolean;
}

export function RequestDetailDialog({
    open,
    onOpenChange,
    request,
    hideAmounts = false
}: Readonly<RequestDetailDialogProps>) {
    const { t } = useTranslation('treasury');

    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl">{request.title}</DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className={getStatusBadgeClass(request.status)}>
                                    {request.status === 'under_review' ? 'pending' : request.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground capitalize">
                                    {request.type.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className={`text-xl font-bold ${request.type === 'fund_request' ? 'text-blue-600' : 'text-red-600'}`}>
                            {request.type === 'reimbursement' ? '-' : ''}
                            {formatCurrency(request.amount, request.currency, hideAmounts)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {request.description && (
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('detail.description')}</h4>
                            <p className="text-sm">{request.description}</p>
                        </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t('detail.requestedBy')}</span>
                                <span className="font-medium">{request.requester?.name || t('detail.unknown')}</span>
                            </div>
                            {request.division && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{t('detail.division')}</span>
                                    <span className="font-medium">{request.division.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t('detail.requestDate')}</span>
                                <span className="font-medium">{formatDate(request.request_date, { format: 'MMM DD, YYYY' })}</span>
                            </div>
                            {request.needed_by_date && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{t('detail.neededBy')}</span>
                                    <span className="font-medium">{formatDate(request.needed_by_date, { format: 'MMM DD, YYYY' })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {request.items && request.items.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('detail.items')}</h4>
                                <div className="space-y-2">
                                    {request.items.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">{item.description}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{item.category?.replace('_', ' ')}</p>
                                            </div>
                                            <span className="font-medium">
                                                {formatCurrency(item.amount, request.currency, hideAmounts)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {request.attachment_path && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                    {t('detail.proofEvidence')}
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                    {(request.attachment_type?.startsWith('image/') ||
                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(request.attachment_filename || '')) && (
                                            <div className="bg-gray-100 p-2">
                                                <img
                                                    src={`/storage/${request.attachment_path}`}
                                                    alt={request.attachment_original_name || request.attachment_filename || 'Attachment'}
                                                    className="max-h-48 w-auto mx-auto rounded object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}

                                    <div className="flex justify-between items-center p-3 bg-muted">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {request.attachment_original_name || request.attachment_filename}
                                                </p>
                                                {request.attachment_size && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {(request.attachment_size / 1024).toFixed(1)} KB
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(`/storage/${request.attachment_path}`, '_blank')}
                                                title="View file"
                                            >
                                                {t('card.view')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                            >
                                                <a href={`/storage/${request.attachment_path}`} download title="Download file">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {request.approvals && request.approvals.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-3">{t('detail.approvalHistory')}</h4>
                                <div className="space-y-3">
                                    {request.approvals.map((approval) => (
                                        <div key={approval.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                            {approval.decision === 'approved' ? (
                                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium capitalize">{approval.approval_level} {t('detail.approval')}</span>
                                                        <span className={`ml-2 text-sm ${approval.decision === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                            ({approval.decision})
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(approval.created_at, { format: 'MMM DD, YYYY' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('detail.by')} {approval.approver?.name || t('detail.unknown')}
                                                </p>
                                                {approval.notes && (
                                                    <p className="text-sm mt-1 italic">"{approval.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {request.approval_stage && !request.approvals?.length && request.status !== 'draft' && (
                        <>
                            <Separator />
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800">
                                <Clock className="h-5 w-5" />
                                <span>
                                    {request.approval_stage === 'pending_leader'
                                        ? t('card.waitingLeader')
                                        : t('card.waitingTreasurer')}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('detail.close')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
