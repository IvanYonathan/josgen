import { Loader2, CheckCircle } from 'lucide-react';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { RequestCard } from './request-card';

interface PendingApprovalsTabProps {
    requests: TreasuryRequest[];
    loading: boolean;
    currentUserId?: number;
    onApprove: (request: TreasuryRequest) => void;
    onReject: (request: TreasuryRequest) => void;
    onView: (request: TreasuryRequest) => void;
}

export function PendingApprovalsTab({
    requests,
    loading,
    currentUserId,
    onApprove,
    onReject,
    onView,
}: Readonly<PendingApprovalsTabProps>) {
    const pendingApprovals = requests.filter(r =>
        r.status === 'submitted' || r.status === 'under_review'
    );

    // Check if current user has already reviewed a request
    const hasUserReviewed = (request: TreasuryRequest): boolean => {
        if (!currentUserId || !request.approvals) return false;
        return request.approvals.some(a => a.user_id === currentUserId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (pendingApprovals.length === 0) {
        return (
            <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                    There are no requests pending your approval.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {pendingApprovals.map((request) => (
                <RequestCard
                    key={request.id}
                    request={request}
                    showApprovalActions={!hasUserReviewed(request)}
                    onApprove={() => onApprove(request)}
                    onReject={() => onReject(request)}
                    onView={() => onView(request)}
                />
            ))}
        </div>
    );
}

