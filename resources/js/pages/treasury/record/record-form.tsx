import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export interface RecordFormData {
    type: 'income' | 'expense';
    title: string;
    description: string;
    amount: string;
    category: string;
    record_date: string;
    reference_number: string;
}

export interface RecordFieldErrors {
    title?: string;
    amount?: string;
    category?: string;
    record_date?: string;
}

interface RecordFormProps {
    formData: RecordFormData;
    setFormData: (data: RecordFormData) => void;
    errors: RecordFieldErrors;
    clearError: (field: keyof RecordFieldErrors) => void;
    incomeCategories: Record<string, string>;
    expenseCategories: Record<string, string>;
}

export function RecordForm({
    formData,
    setFormData,
    errors,
    clearError,
    incomeCategories,
    expenseCategories,
}: Readonly<RecordFormProps>) {
    const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Record Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="record-type">Type</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any, category: '' })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="income">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        Income
                                    </span>
                                </SelectItem>
                                <SelectItem value="expense">
                                    <span className="flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        Expense
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-category" className="flex items-center gap-1">
                            Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.category}
                            onValueChange={(v) => {
                                setFormData({ ...formData, category: v });
                                clearError('category');
                            }}
                        >
                            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categories).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.category}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="record-title" className="flex items-center gap-1">
                        Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="record-title"
                        placeholder="e.g., Monthly donation from member"
                        value={formData.title}
                        onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            clearError('title');
                        }}
                        className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.title}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="record-description">Description (Optional)</Label>
                    <Textarea
                        id="record-description"
                        placeholder="Additional details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="record-amount" className="flex items-center gap-1">
                            Amount (Rp) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="record-amount"
                            type="text"
                            placeholder="0"
                            value={formData.amount ? formData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, amount: rawValue });
                                clearError('amount');
                            }}
                            className={errors.amount ? 'border-red-500' : ''}
                        />
                        {errors.amount && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.amount}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="record-date" className="flex items-center gap-1">
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="record-date"
                            type="date"
                            value={formData.record_date}
                            onChange={(e) => {
                                setFormData({ ...formData, record_date: e.target.value });
                                clearError('record_date');
                            }}
                            className={errors.record_date ? 'border-red-500' : ''}
                        />
                        {errors.record_date && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.record_date}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="record-reference">Reference Number (Optional)</Label>
                    <Input
                        id="record-reference"
                        placeholder="e.g., Invoice number, receipt number"
                        value={formData.reference_number}
                        onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
