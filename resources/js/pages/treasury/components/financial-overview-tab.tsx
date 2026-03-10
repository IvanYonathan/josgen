import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonthlyBarChart, CategoryPieChart, PIE_COLORS } from '@/components/ui/chart';
import {
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    XCircle,
    FileText,
} from 'lucide-react';
import { TreasuryStats } from '@/types/treasury/treasury';
import { formatCurrency, getStatusBadgeClass } from './request-card';
import { formatDate } from '@/utils/date';
import { useTranslation } from '@/hooks/use-translation';

interface FinancialOverviewTabProps {
    stats: TreasuryStats | null;
    statsLoading: boolean;
    statsError: string | null;
    hideAmounts: boolean;
    onToggleHideAmounts: () => void;
    onLoadStats: () => void;
    onAddReport: () => void;
}

export function FinancialOverviewTab({
    stats,
    statsLoading,
    statsError,
    hideAmounts,
    onToggleHideAmounts,
    onLoadStats,
    onAddReport,
}: Readonly<FinancialOverviewTabProps>) {
    const { t } = useTranslation('treasury');

    // Prepare chart data - now using income/expense from FinancialRecord
    const chartData = stats?.chart_data?.map(d => ({
        month: d.month,
        income: d.income || 0,
        expense: d.expense || 0,
    })) || [];

    const categoryData = stats?.category_breakdown?.map((c, i) => ({
        name: c.label,
        value: Number.parseFloat(String(c.total_amount)) || 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
    })) || [];

    const incomeCategoryData = stats?.income_category_breakdown?.map((c, i) => ({
        name: c.label,
        value: Number.parseFloat(String(c.total_amount)) || 0,
        color: PIE_COLORS[(i + 3) % PIE_COLORS.length], // Offset colors to differentiate from expense
    })) || [];

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">{t('financialOverview.loadingStats')}</span>
            </div>
        );
    }

    if (statsError) {
        return (
            <div className="text-center py-12">
                <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('financialOverview.failedLoadStats')}</h3>
                <p className="text-muted-foreground mb-4">{statsError}</p>
                <Button variant="outline" onClick={onLoadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('financialOverview.tryAgain')}
                </Button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('financialOverview.noStats')}</h3>
                <Button variant="outline" onClick={onLoadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('financialOverview.loadStats')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('financialOverview.totalIncome')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.summary.total_income || 0, 'IDR', hideAmounts)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('financialOverview.totalExpenses')}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(stats.summary.total_expenses || 0, 'IDR', hideAmounts)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('financialOverview.currentBalance')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.summary.current_balance || 0, 'IDR', hideAmounts)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('financialOverview.pendingRequests')}</CardTitle>
                        <FileText className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.summary.pending_requests}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('financialOverview.monthlyCashFlow')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <MonthlyBarChart data={chartData} height={300} />
                    ) : (
                        <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">{t('financialOverview.noData')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">{t('financialOverview.incomeByCategory')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {incomeCategoryData.length > 0 ? (
                            <CategoryPieChart data={incomeCategoryData} height={300} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">{t('financialOverview.noIncomeData')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">{t('financialOverview.expenseByCategory')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <CategoryPieChart data={categoryData} height={300} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">{t('financialOverview.noExpenseData')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('financialOverview.recentTransactions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.pending_approval.length > 0 ? (
                        <div className="space-y-4">
                            {stats.pending_approval.slice(0, 5).map((request) => (
                                <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${request.type === 'fund_request' ? 'bg-blue-100' : 'bg-red-100'}`}>
                                            {request.type === 'fund_request' ? (
                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{request.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.division?.name} • {formatDate(request.request_date, { format: 'MMM DD, YYYY' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${request.type === 'reimbursement' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {request.type === 'reimbursement' ? '-' : ''}
                                            {formatCurrency(request.amount, request.currency, hideAmounts)}
                                        </p>
                                        <Badge className={getStatusBadgeClass(request.status)}>
                                            {request.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">{t('financialOverview.noRecentTransactions')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
