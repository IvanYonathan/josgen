import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { TreasuryRequest, TreasuryStats } from '@/types/treasury/treasury';
import { listTreasury, getTreasuryStats, deleteTreasury, approveTreasury } from '@/lib/api/treasury';
import type { SharedData } from '@/types';
import { AxiosJosgen, ApiResponse } from '@/lib/axios/axios-josgen';

// Import components - direct imports (no barrel file)
import { MyRequestsTab } from './components/my-requests-tab';
import { PendingApprovalsTab } from './components/pending-approvals-tab';
import { FinancialOverviewTab } from './components/financial-overview-tab';
import { CreateRequestDialog } from './components/create-request-dialog';
import { AddRecordDialog } from './components/add-record-dialog';
import { RejectDialog } from './components/reject-dialog';
import { RequestDetailDialog } from './components/request-detail-dialog';

// Check if user has admin/treasurer permissions
const hasAdminAccess = (role?: string): boolean => {
  if (!role) return false;
  const adminRoles = ['sysadmin', 'admin', 'treasurer', 'division_leader'];
  return adminRoles.includes(role.toLowerCase());
};

export function TreasuryPage() {
  const { auth } = usePage<SharedData>().props;
  const userRole = auth?.user?.role;
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

  // Categories from API
  const [incomeCategories, setIncomeCategories] = useState<Record<string, string>>({});
  const [expenseCategories, setExpenseCategories] = useState<Record<string, string>>({});

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TreasuryRequest | null>(null);
  const [editRequest, setEditRequest] = useState<TreasuryRequest | null>(null);

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
      toast.error(err instanceof Error ? err.message : 'Failed to load requests', { duration: 5000 });
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

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!canAccessAdmin) return;

    try {
      const response = await AxiosJosgen.post<ApiResponse<{
        income_categories: Record<string, string>;
        expense_categories: Record<string, string>
      }>>('/treasury/records/categories');
      if (response.data.status) {
        setIncomeCategories(response.data.data.income_categories);
        setExpenseCategories(response.data.data.expense_categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [canAccessAdmin]);

  useEffect(() => {
    loadRequests();
    if (canAccessAdmin) {
      loadStats();
      loadCategories();
    }
  }, [loadRequests, loadStats, loadCategories, canAccessAdmin]);

  // Handlers
  const handleApprove = async (request: TreasuryRequest) => {
    try {
      await approveTreasury({ id: request.id });
      toast.success('Request approved successfully');
      loadRequests();
      loadStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request', { duration: 5000 });
    }
  };

  const handleDelete = async (request: TreasuryRequest) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      await deleteTreasury(request.id);
      toast.success('Request deleted successfully');
      loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete request', { duration: 5000 });
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
    try {
      await AxiosJosgen.post<ApiResponse<any>>('/treasury/submit', { id: request.id });
      toast.success('Request resubmitted successfully! It will go through a fresh approval cycle.');
      loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resubmit request', { duration: 5000 });
    }
  };

  const handleRefresh = () => {
    loadRequests();
    if (canAccessAdmin) loadStats();
  };

  return (
    <div className="p-6">
      {/* Header with title and refresh */}
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

        {/* Right side buttons - different per tab */}
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
              <Button onClick={() => setAddRecordDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Report
              </Button>
            </>
          ) : (
            <Button onClick={() => {
              setEditRequest(null);
              setCreateDialogOpen(true);
            }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
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

        {/* My Requests Tab */}
        <TabsContent value="my-requests">
          <MyRequestsTab
            requests={requests}
            loading={loading}
            onEdit={async (req) => {
              // Fetch full request data (including attachments) for editing
              try {
                const response = await AxiosJosgen.post<ApiResponse<{ request: TreasuryRequest }>>('/treasury/get', { id: req.id });
                if (response.data.status) {
                  setEditRequest(response.data.data.request);
                } else {
                  setEditRequest(req);
                }
              } catch (err) {
                console.error('Failed to fetch request details for edit:', err);
                setEditRequest(req);
              }
              setCreateDialogOpen(true);
            }}
            onDelete={handleDelete}
            onView={openDetailDialog}
            onResubmit={handleResubmit}
            onCreateNew={() => {
              setEditRequest(null);
              setCreateDialogOpen(true);
            }}
          />
        </TabsContent>

        {/* Financial Overview Tab */}
        {canAccessAdmin && (
          <TabsContent value="financial-overview">
            <FinancialOverviewTab
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              hideAmounts={hideAmounts}
              onToggleHideAmounts={() => setHideAmounts(!hideAmounts)}
              onLoadStats={loadStats}
              onAddReport={() => setAddRecordDialogOpen(true)}
            />
          </TabsContent>
        )}

        {/* Pending Approvals Tab */}
        {canAccessAdmin && (
          <TabsContent value="pending-approvals">
            <PendingApprovalsTab
              requests={requests}
              loading={loading}
              currentUserId={auth?.user?.id}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onView={openDetailDialog}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <CreateRequestDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditRequest(null); // Clear edit state when closing
        }}
        onSuccess={handleRefresh}
        editRequest={editRequest}
      />

      <AddRecordDialog
        open={addRecordDialogOpen}
        onOpenChange={setAddRecordDialogOpen}
        onSuccess={() => loadStats()}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
      />

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
    </div>
  );
}