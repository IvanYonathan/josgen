import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, TrendingUp, TrendingDown, PlusCircle, RefreshCw, Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// Placeholder types - replace with actual API types
interface TreasuryRequest {
  id: number;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  request_date: string;
  division_name?: string;
}

interface TreasuryStats {
  total_income: number;
  total_expenses: number;
  pending_requests: number;
  balance: number;
}

interface TreasuryResponse {
  requests: TreasuryRequest[];
  stats: TreasuryStats;
  total: number;
}

export function TreasuryPage() {
  const { t } = useTranslation('treasury');
  const [requests, setRequests] = useState<TreasuryRequest[]>([]);
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load treasury data from API
  const loadTreasuryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when treasury API is implemented
      // const response = await listTreasuryRequests();
      // setRequests(response.requests);
      // setStats(response.stats);

      // Mock data for now
      const mockStats: TreasuryStats = {
        total_income: 150000,
        total_expenses: 85000,
        pending_requests: 5,
        balance: 65000
      };

      const mockRequests: TreasuryRequest[] = [
        {
          id: 1,
          title: 'Office Equipment Purchase',
          description: 'New laptops and monitors for the development team',
          amount: 15000,
          currency: 'USD',
          type: 'expense',
          status: 'pending',
          requested_by: 'John Smith',
          request_date: '2024-05-10',
          division_name: 'Engineering'
        },
        {
          id: 2,
          title: 'Marketing Campaign Budget',
          description: 'Q2 digital marketing campaign expenses',
          amount: 8500,
          currency: 'USD',
          type: 'expense',
          status: 'approved',
          requested_by: 'Sarah Johnson',
          request_date: '2024-05-08',
          division_name: 'Marketing'
        },
        {
          id: 3,
          title: 'Client Payment Received',
          description: 'Payment for Project ABC completion',
          amount: 25000,
          currency: 'USD',
          type: 'income',
          status: 'approved',
          requested_by: 'Mike Chen',
          request_date: '2024-05-05',
          division_name: 'Sales'
        },
        {
          id: 4,
          title: 'Team Building Event',
          description: 'Annual team building activities and catering',
          amount: 3200,
          currency: 'USD',
          type: 'expense',
          status: 'rejected',
          requested_by: 'Emily Davis',
          request_date: '2024-05-03',
          division_name: 'HR'
        }
      ];

      setRequests(mockRequests);
      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treasury data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreasuryData();
  }, []);

  const getStatusColor = (status: TreasuryRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Treasury</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTreasuryData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_income)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.total_expenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.balance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_requests}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No treasury requests found</p>
          <Button variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create your first request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Requests</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {requests.map(request => (
              <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 text-base">{request.title}</CardTitle>
                      {request.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {request.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {request.type === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm capitalize">{request.type}</span>
                    </div>
                    <div className={`text-lg font-bold ${request.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(request.amount, request.currency)}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Requested by:</span>
                      <span className="font-medium">{request.requested_by}</span>
                    </div>
                    {request.division_name && (
                      <div className="flex justify-between">
                        <span>Division:</span>
                        <span className="font-medium">{request.division_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{new Date(request.request_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TODO: Add pagination when API supports it */}
      {requests.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {requests.length} requests
          </p>
        </div>
      )}
    </div>
  );
}