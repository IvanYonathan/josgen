import { TreasuryRequest } from '@/types/treasury/treasury';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    User,
    Building,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';

// Helpers
export const getStatusBadgeClass = (status: TreasuryRequest['status']) => {
    switch (status) {
        case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'submitted': return '!bg-blue-100 !text-blue-800 !border-blue-200';
        case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'approved': return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
        case 'paid': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const formatCurrency = (amount: number, currency: string = 'IDR', hidden: boolean = false) => {
    if (hidden) return '••••••••';
    const formatted = Math.abs(amount)
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const prefix = currency === 'IDR' ? 'Rp' : currency + ' ';
    return amount < 0 ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getApprovalStageLabel = (stage: string) => {
    switch (stage) {
        case 'pending_leader': return 'Waiting for Leader';
        case 'pending_treasurer': return 'Waiting for Treasurer';
        case 'approved': return 'Fully Approved';
        case 'rejected': return 'Rejected';
        default: return stage;
    }
};

interface RequestCardProps {
    request: TreasuryRequest;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onResubmit?: () => void;
    showApprovalActions?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
    hideAmounts?: boolean;
}

export function RequestCard({
    request,
    onEdit,
    onDelete,
    onView,
    onResubmit,
    showApprovalActions,
    onApprove,
    onReject,
    hideAmounts = false
}: RequestCardProps) {
    const canEdit = request.status === 'draft' || request.status === 'submitted' || request.status === 'rejected';
    const canDelete = request.status === 'draft';
    const canResubmit = request.status === 'rejected';

    const rejectionNotes = request.approvals?.find(a => a.decision === 'rejected')?.notes;

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base truncate">{request.title}</CardTitle>
                            <Badge className={getStatusBadgeClass(request.status)}>
                                {request.status === 'under_review' ? 'pending' : request.status}
                            </Badge>
                        </div>
                        {request.description && (
                            <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                                {request.description}
                            </CardDescription>
                        )}
                    </div>
                    <div className={`text-lg font-bold whitespace-nowrap ${request.type === 'fund_request' ? 'text-blue-600' : 'text-red-600'}`}>
                        {request.type === 'reimbursement' ? '-' : ''}{formatCurrency(request.amount, request.currency, hideAmounts)}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {request.status === 'rejected' && rejectionNotes && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Rejection Reason:</strong> {rejectionNotes}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {request.requester && (
                        <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{request.requester.name}</span>
                        </div>
                    )}
                    {request.division && (
                        <div className="flex items-center gap-1">
                            <Building className="h-3.5 w-3.5" />
                            <span>{request.division.name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(request.request_date)}</span>
                    </div>
                </div>

                    {request.approval_stage && request.status !== 'draft' && request.status !== 'rejected' && (
                    <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Approval Status:</p>
                        {request.approvals && request.approvals.length > 0 ? (
                            <div className="space-y-1">
                                {request.approvals.map((approval) => (
                                    <div key={approval.id} className="flex items-center gap-2 text-sm">
                                        {approval.decision === 'approved' ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="capitalize">{approval.approval_level}</span>
                                        <span className={approval.decision === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                            {approval.decision}
                                        </span>
                                        {approval.approver && (
                                            <span className="text-muted-foreground">• {approval.approver.name}</span>
                                        )}
                                    </div>
                                ))}
                                {request.approval_stage === 'pending_leader' && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Waiting for Leader approval</span>
                                    </div>
                                )}
                                {request.approval_stage === 'pending_treasurer' && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>Waiting for Treasurer approval</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {getApprovalStageLabel(request.approval_stage)}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                    {showApprovalActions && (request.status === 'submitted' || request.status === 'under_review') ? (
                        <>
                            <Button size="sm" className="!bg-green-600 hover:!bg-green-700 text-white" onClick={onApprove}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={onReject}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                            </Button>
                            <Button size="sm" variant="outline" onClick={onView}>
                                View
                            </Button>
                        </>
                    ) : (
                        <>
                            {canEdit && onEdit && (
                                <Button size="sm" variant="outline" onClick={onEdit}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                            )}
                            {canResubmit && onResubmit && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onResubmit}>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Resubmit
                                </Button>
                            )}
                            {canDelete && onDelete && (
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            )}
                            {onView && (
                                <Button size="sm" variant="ghost" onClick={onView}>
                                    View
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
