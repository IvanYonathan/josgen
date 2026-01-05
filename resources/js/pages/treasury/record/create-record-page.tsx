import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AxiosJosgen, ApiResponse } from '@/lib/axios/axios-josgen';
import { RecordForm, RecordFormData, RecordFieldErrors } from './record-form';

export function CreateRecordPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [incomeCategories, setIncomeCategories] = useState<Record<string, string>>({});
    const [expenseCategories, setExpenseCategories] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<RecordFieldErrors>({});
    const [formData, setFormData] = useState<RecordFormData>({
        type: 'income',
        title: '',
        description: '',
        amount: '',
        category: '',
        record_date: new Date().toISOString().split('T')[0],
        reference_number: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await AxiosJosgen.post<ApiResponse<{
                income_categories: Record<string, string>;
                expense_categories: Record<string, string>;
            }>>('/treasury/records/categories');
            if (response.data.status) {
                setIncomeCategories(response.data.data.income_categories);
                setExpenseCategories(response.data.data.expense_categories);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: RecordFieldErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        if (!formData.record_date) {
            newErrors.record_date = 'Date is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error(new Error('Please fill in all required fields'), { title: 'Validation error' });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const { id: toastId } = toast.loading({ title: 'Adding financial record...' });
        try {
            setLoading(true);

            const payload = {
                type: formData.type,
                title: formData.title,
                description: formData.description,
                amount: Number.parseFloat(formData.amount),
                record_date: formData.record_date,
                category: formData.category,
                reference_number: formData.reference_number,
            };

            const response = await AxiosJosgen.post<ApiResponse<any>>('/treasury/records/create', payload);

            if (!response.data.status) throw new Error(response.data.message);

            toast.success({ itemID: toastId, title: 'Financial record added successfully' });
            navigate('/treasury');
        } catch (err) {
            toast.error(err, { itemID: toastId, title: 'Failed to add record' });
        } finally {
            setLoading(false);
        }
    };

    const clearError = (field: keyof RecordFieldErrors) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/treasury')} className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Add Financial Record</h1>
                        <p className="text-muted-foreground">
                            Record organization income or expense transaction.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <RecordForm
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        clearError={clearError}
                        incomeCategories={incomeCategories}
                        expenseCategories={expenseCategories}
                    />

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/treasury')}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {formData.type === 'income' ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
                            Add {formData.type === 'income' ? 'Income' : 'Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
