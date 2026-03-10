import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { expense_categories, TreasuryRequest } from '@/types/treasury/treasury';
import { useTranslation } from '@/hooks/use-translation';

export interface ItemInput {
    id?: number;
    description: string;
    amount: string;
    category: string;
    item_date: string;
}

export interface RequestFormData {
    type: 'fund_request' | 'reimbursement';
    title: string;
    description: string;
}

export interface FieldErrors {
    title?: string;
    description?: string;
    attachment?: string;
    items?: { [index: number]: { description?: string; amount?: string; category?: string; item_date?: string } };
}

interface RequestFormProps {
    formData: RequestFormData;
    setFormData: (data: RequestFormData) => void;
    items: ItemInput[];
    setItems: (items: ItemInput[]) => void;
    errors: FieldErrors;
    clearError: (field: keyof FieldErrors) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    existingAttachment?: { name: string; path: string } | null;
}

export const createEmptyItem = (): ItemInput => ({
    description: '',
    amount: '',
    category: '',
    item_date: new Date().toISOString().split('T')[0],
});

export function RequestForm({
    formData,
    setFormData,
    items,
    setItems,
    errors,
    clearError,
    file,
    setFile,
    existingAttachment,
}: Readonly<RequestFormProps>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation('treasury');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const selectedFile = selectedFiles[0];
            if (selectedFile.size > 10 * 1024 * 1024) {
                return;
            }
            setFile(selectedFile);
            if (errors.attachment) {
                clearError('attachment');
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const droppedFile = droppedFiles[0];
            if (droppedFile.size > 10 * 1024 * 1024) {
                return;
            }
            setFile(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const addItem = () => {
        setItems([...items, createEmptyItem()]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof ItemInput, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotalAmount = (): number => {
        return items.reduce((sum, item) => {
            const amount = Number.parseFloat(item.amount) || 0;
            return sum + amount;
        }, 0);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('form.requestDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="flex items-center gap-1">
                                {t('form.titleLabel')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder={t('form.titlePlaceholder')}
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
                            <Label htmlFor="type">{t('form.type')}</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="reimbursement">{t('form.reimbursement')}</SelectItem>
                                    <SelectItem value="fund_request">{t('form.fundRequest')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="flex items-center gap-1">
                            {t('form.descriptionLabel')} <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder={t('form.descriptionPlaceholder')}
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                clearError('description');
                            }}
                            rows={3}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> {errors.description}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-1">
                            {t('form.items')} <span className="text-red-500">*</span>
                        </CardTitle>
                        <span className="text-sm font-medium">
                            {t('form.total')} Rp{calculateTotalAmount().toLocaleString('id-ID')}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{t('form.itemLabel', { number: index + 1 })}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">{t('form.itemDescription')}</Label>
                                <Input
                                    placeholder={t('form.itemDescPlaceholder')}
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('form.amount')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        placeholder="0"
                                        value={item.amount ? item.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, '');
                                            updateItem(index, 'amount', rawValue);
                                        }}
                                        className={errors.items?.[index]?.amount ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('form.category')} <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={item.category}
                                        onValueChange={(v) => updateItem(index, 'category', v)}
                                    >
                                        <SelectTrigger className={errors.items?.[index]?.category ? 'border-red-500' : ''}>
                                            <SelectValue placeholder={t('form.categoryPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(expense_categories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{t('form.date')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={item.item_date}
                                        onChange={(e) => updateItem(index, 'item_date', e.target.value)}
                                        className={errors.items?.[index]?.item_date ? 'border-red-500' : ''}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addItem}
                        className="w-full border-dashed"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('form.addItem')}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-1">
                        {t('form.attachments')} <span className="text-red-500">*</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors ${errors.attachment ? 'border-red-500' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                            {t('form.uploadText')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('form.uploadHint')}
                        </p>
                    </div>
                    {errors.attachment && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
                            <AlertCircle className="h-3 w-3" /> {errors.attachment}
                        </p>
                    )}

                    {file && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-5 w-5" />
                                    <span className="truncate max-w-[400px]">{file.name}</span>
                                    <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {existingAttachment && !file && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">{t('form.currentAttachment')}</p>
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-5 w-5" />
                                    <span>{existingAttachment.name}</span>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {t('form.change')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
