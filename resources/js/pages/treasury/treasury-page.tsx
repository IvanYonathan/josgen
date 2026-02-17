import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TreasuryRequest, TreasuryStats } from '@/types/treasury/treasury';
import { listTreasury, getTreasuryStats, deleteTreasury, approveTreasury } from '@/lib/api/treasury';
import { AxiosJosgen, ApiResponse } from '@/lib/axios/axios-josgen';

import { MyRequestsTab } from './components/my-requests-tab';
import { PendingApprovalsTab } from './components/pending-approvals-tab';
import { FinancialOverviewTab } from './components/financial-overview-tab';
import { RejectDialog } from './components/reject-dialog';
import { RequestDetailDialog } from './components/request-detail-dialog';
import { DeleteRequestDialog } from './components/delete-request-dialog';

// Check if user has admin/treasurer permissions
const hasAdminAccess = (role?: string): boolean => {
  if (!role) return false;
  const adminRoles = ['sysadmin', 'admin', 'treasurer', 'division_leader'];
  return adminRoles.includes(role.toLowerCase());
};

export function TreasuryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = user.role;
  const canAccessAdmin = hasAdminAccess(userRole);

  // Tab state
  const [activeTab, setActiveTab] = useState('my-requests');

  // Data state
  const [requests, setRequests] = useState<TreasuryRequest[]>([]);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Hide amounts toggle (only for Financial Overview)
  const [hideAmounts, setHideAmounts] = useState(false);

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TreasuryRequest | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<TreasuryRequest | null>(null);

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listTreasury();
      setRequests(response.requests);

      if (canAccessAdmin) {
        const pending = response.requests.filter(r =>
          r.status === 'submitted' || r.status === 'under_review'
        ).length;
        setPendingCount(pending);
      }
    } catch (err) {
      toast.error(err, { title: 'Failed to load requests' });
    } finally {
      setLoading(false);
    }
  }, [canAccessAdmin]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!canAccessAdmin) return;

    try {
      setStatsLoading(true);
      setStatsError(null);
      const statsData = await getTreasuryStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setStatsError(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  }, [canAccessAdmin]);

  useEffect(() => {
    loadRequests();
    if (canAccessAdmin) {
      loadStats();
    }
  }, [loadRequests, loadStats, canAccessAdmin]);

  // Handlers
  const handleApprove = async (request: TreasuryRequest) => {
    const { id } = toast.loading({ title: 'Approving request...' });
    try {
      await approveTreasury({ id: request.id });
      toast.success({ itemID: id, title: 'Request approved successfully' });
      loadRequests();
      loadStats();
    } catch (err) {
      toast.error(err, { itemID: id, title: 'Failed to approve request' });
    }
  };

  const openDeleteDialog = (request: TreasuryRequest) => {
    setDeleteRequest(request);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRequest) return;

    setDeleteLoading(true);
    const { id } = toast.loading({ title: 'Deleting request...' });
    try {
      await deleteTreasury(deleteRequest.id);
      toast.success({ itemID: id, title: 'Request deleted successfully' });
      setDeleteDialogOpen(false);
      setDeleteRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err, { itemID: id, title: 'Failed to delete request' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openRejectDialog = (request: TreasuryRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const openDetailDialog = async (request: TreasuryRequest) => {
    try {
      // Fetch full request details including attachments
      const response = await AxiosJosgen.post<ApiResponse<{ request: TreasuryRequest }>>('/treasury/get', { id: request.id });
      if (response.data.status) {
        setSelectedRequest(response.data.data.request);
      } else {
        setSelectedRequest(request); // Fallback to existing data
      }
    } catch (err) {
      console.error('Failed to fetch request details:', err);
      setSelectedRequest(request); // Fallback to existing data
    }
    setDetailDialogOpen(true);
  };

  const handleResubmit = async (request: TreasuryRequest) => {
    const { id } = toast.loading({ title: 'Resubmitting request...' });
    try {
      await AxiosJosgen.post<ApiResponse<any>>('/treasury/submit', { id: request.id });
      toast.success({ itemID: id, title: 'Request resubmitted successfully! It will go through a fresh approval cycle.' });
      loadRequests();
    } catch (err) {
      toast.error(err, { itemID: id, title: 'Failed to resubmit request' });
    }
  };

  const handleRefresh = () => {
    loadRequests();
    if (canAccessAdmin) loadStats();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Treasury</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'financial-overview' ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHideAmounts(!hideAmounts)}
                title={hideAmounts ? 'Show amounts' : 'Hide amounts'}
              >
                {hideAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button onClick={() => navigate('/treasury/record/new')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Report
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/treasury/request/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          {canAccessAdmin && (
            <TabsTrigger value="financial-overview">Financial Overview</TabsTrigger>
          )}
          {canAccessAdmin && (
            <TabsTrigger value="pending-approvals" className="relative">
              Pending Approvals
              {pendingCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests">
          <MyRequestsTab
            requests={requests}
            loading={loading}
            onEdit={(req) => navigate(`/treasury/request/${req.id}/edit`)}
            onDelete={openDeleteDialog}
            onView={openDetailDialog}
            onResubmit={handleResubmit}
            onCreateNew={() => navigate('/treasury/request/new')}
          />
        </TabsContent>

        {canAccessAdmin && (
          <TabsContent value="financial-overview">
            <FinancialOverviewTab
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              hideAmounts={hideAmounts}
              onToggleHideAmounts={() => setHideAmounts(!hideAmounts)}
              onLoadStats={loadStats}
              onAddReport={() => navigate('/treasury/record/new')}
            />
          </TabsContent>
        )}

        {canAccessAdmin && (
          <TabsContent value="pending-approvals">
            <PendingApprovalsTab
              requests={requests}
              loading={loading}
              currentUserId={user.id}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onView={openDetailDialog}
            />
          </TabsContent>
        )}
      </Tabs>

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        request={selectedRequest}
        onSuccess={handleRefresh}
      />

      <RequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        request={selectedRequest}
        hideAmounts={hideAmounts}
      />

      <DeleteRequestDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        request={deleteRequest}
        isLoading={deleteLoading}
      />
    </div>
  );
}