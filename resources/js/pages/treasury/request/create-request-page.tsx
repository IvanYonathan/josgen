import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { createTreasury, uploadTreasuryAttachment } from '@/lib/api/treasury';
import { RequestForm, RequestFormData, ItemInput, FieldErrors, createEmptyItem } from './request-form';

export function CreateRequestPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useTranslation('treasury');

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<RequestFormData>({
        type: 'reimbursement',
        title: '',
        description: '',
    });
    const [items, setItems] = useState<ItemInput[]>([createEmptyItem()]);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const hasChanges = () => {
        return formData.title || formData.description ||
            items.some(item => item.description || item.amount || item.category) ||
            file !== null;
    };

    const validateForm = (): boolean => {
        const newErrors: FieldErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = t('validation.titleRequired');
        }
        if (!formData.description.trim()) {
            newErrors.description = t('validation.descriptionRequired');
        }

        const itemErrors: { [index: number]: { description?: string; amount?: string; category?: string; item_date?: string } } = {};
        items.forEach((item, index) => {
            const errs: { description?: string; amount?: string; category?: string; item_date?: string } = {};
            if (!item.amount || Number.parseFloat(item.amount) <= 0) {
                errs.amount = t('validation.amountRequired');
            }
            if (!item.category) {
                errs.category = t('validation.categoryRequired');
            }
            if (!item.item_date) {
                errs.item_date = t('validation.dateRequired');
            }
            if (Object.keys(errs).length > 0) {
                itemErrors[index] = errs;
            }
        });

        if (Object.keys(itemErrors).length > 0) {
            newErrors.items = itemErrors;
        }

        if (!file) {
            newErrors.attachment = t('validation.attachmentRequired');
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error(new Error(t('toast.fillRequired')), { title: t('toast.validationError') });
            return false;
        }

        return true;
    };

    const calculateTotalAmount = (): number => {
        return items.reduce((sum, item) => {
            const amount = Number.parseFloat(item.amount) || 0;
            return sum + amount;
        }, 0);
    };

    const handleSubmitClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setShowSubmitConfirm(false);

        const totalAmount = calculateTotalAmount();
        const { id: toastId } = toast.loading({ title: t('toast.submitting') });

        try {
            setLoading(true);

            const apiItems = items.map(item => ({
                description: item.description || formData.title,
                amount: Number.parseFloat(item.amount),
                category: item.category,
                item_date: item.item_date,
            }));

            const result = await createTreasury({
                type: formData.type,
                title: formData.title,
                description: formData.description,
                amount: totalAmount,
                request_date: items[0]?.item_date || new Date().toISOString().split('T')[0],
                items: apiItems,
                submit: true,
            });

            if (file) {
                await uploadTreasuryAttachment({
                    treasury_request_id: result.request.id,
                    file,
                });
            }

            toast.success({ itemID: toastId, title: t('toast.submitted') });
            navigate('/treasury');
        } catch (err) {
            toast.error(err, { itemID: toastId, title: t('toast.failedCreate') });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (hasChanges()) {
            setShowCancelConfirm(true);
        } else {
            navigate('/treasury');
        }
    };

    const clearError = (field: keyof FieldErrors) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-1">
                        <Button variant="ghost" size="icon" onClick={handleCancelClick} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{t('form.submitNewRequest')}</h1>
                            <p className="text-muted-foreground">
                                {t('form.submitNewRequestDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto">
                    <form onSubmit={handleSubmitClick}>
                        <RequestForm
                            formData={formData}
                            setFormData={setFormData}
                            items={items}
                            setItems={setItems}
                            errors={errors}
                            clearError={clearError}
                            file={file}
                            setFile={setFile}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={handleCancelClick}>
                                {t('form.cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t('form.submitRequest')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialogs.discardTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dialogs.discardDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('dialogs.keepEditing')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate('/treasury')} className="bg-red-600 hover:bg-red-700">
                            {t('dialogs.discardChanges')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialogs.submitTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dialogs.submitDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit}>
                            {t('dialogs.submit')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
