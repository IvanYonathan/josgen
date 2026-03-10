import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, PlusCircle } from 'lucide-react';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { RequestCard } from './request-card';

interface MyRequestsTabProps {
    requests: TreasuryRequest[];
    loading: boolean;
    onEdit: (request: TreasuryRequest) => void;
    onDelete: (request: TreasuryRequest) => void;
    onView: (request: TreasuryRequest) => void;
    onResubmit: (request: TreasuryRequest) => void;
    onCreateNew: () => void;
}

export function MyRequestsTab({
    requests,
    loading,
    onEdit,
    onDelete,
    onView,
    onResubmit,
    onCreateNew,
}: Readonly<MyRequestsTabProps>) {
    const { t } = useTranslation('treasury');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('myRequests.noRequests')}</h3>
                <p className="text-muted-foreground mb-4">
                    {t('myRequests.noRequestsDesc')}
                </p>
                <Button onClick={onCreateNew}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t('myRequests.createRequest')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <RequestCard
                    key={request.id}
                    request={request}
                    onEdit={() => onEdit(request)}
                    onDelete={() => onDelete(request)}
                    onView={() => onView(request)}
                    onResubmit={() => onResubmit(request)}
                />
            ))}
        </div>
    );
}
