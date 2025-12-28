import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AxiosJosgen, ApiResponse } from '@/lib/axios/axios-josgen';

interface AddRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  incomeCategories: Record<string, string>;
  expenseCategories: Record<string, string>;
}

export function AddRecordDialog({
  open,
  onOpenChange,
  onSuccess,
  incomeCategories,
  expenseCategories
}: Readonly<AddRecordDialogProps>) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    title: '',
    description: '',
    amount: '',
    category: '',
    record_date: new Date().toISOString().split('T')[0],
    reference_number: '',
  });

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  // Reset category when type changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, category: '' }));
  }, [formData.type]);

  const resetForm = () => {
    setFormData({
      type: 'income',
      title: '',
      description: '',
      amount: '',
      category: '',
      record_date: new Date().toISOString().split('T')[0],
      reference_number: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error(new Error('Please fill in all required fields'), { title: 'Validation error' });
      return;
    }

    const { id } = toast.loading({ title: 'Adding financial record...' });
    try {
      setLoading(true);
      const response = await AxiosJosgen.post<ApiResponse<any>>('/treasury/records/create', {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        record_date: formData.record_date,
        category: formData.category,
        reference_number: formData.reference_number,
      });

      if (!response.data.status) throw new Error(response.data.message);

      toast.success({ itemID: id, title: 'Financial record added successfully' });
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (err) {
      toast.error(err, { itemID: id, title: 'Failed to add record' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Add Financial Record</DialogTitle>
          <DialogDescription>
            Record organization income or expense transaction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="record-type">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
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
              <Label htmlFor="record-category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-title">Title</Label>
            <Input
              id="record-title"
              placeholder="e.g., Monthly donation from member"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="record-description">Description (Optional)</Label>
            <Textarea
              id="record-description"
              placeholder="Additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="record-amount">Amount</Label>
              <Input
                id="record-amount"
                type="text"
                placeholder="0"
                value={formData.amount ? formData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, amount: rawValue });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="record-date">Date</Label>
              <Input
                id="record-date"
                type="date"
                value={formData.record_date}
                onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  );
}
