import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { getTreasury, updateTreasury, uploadTreasuryAttachment } from '@/lib/api/treasury';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { RequestForm, RequestFormData, ItemInput, FieldErrors, createEmptyItem } from './request-form';

export function EditRequestPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { t } = useTranslation('treasury');

    const [loading, setLoading] = useState(false);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [editRequest, setEditRequest] = useState<TreasuryRequest | null>(null);
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

    useEffect(() => {
        if (id) {
            loadRequestData(parseInt(id));
        }
    }, [id]);

    const loadRequestData = async (requestId: number) => {
        try {
            setLoadingRequest(true);
            const data = await getTreasury(requestId);
            const request = data.request;
            setEditRequest(request);
            setFormData({
                type: request.type,
                title: request.title,
                description: request.description,
            });
            if (request.items && request.items.length > 0) {
                setItems(request.items.map(item => ({
                    id: item.id,
                    description: item.description,
                    amount: String(item.amount),
                    category: item.category,
                    item_date: item.item_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                })));
            }
        } catch (err) {
            toast.error(err, { title: t('toast.failedLoad') });
            navigate('/treasury');
        } finally {
            setLoadingRequest(false);
        }
    };

    const hasChanges = () => {
        if (!editRequest) return false;
        return formData.title !== editRequest.title ||
            formData.description !== editRequest.description ||
            formData.type !== editRequest.type ||
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

        // For edit, attachment is optional if already exists
        if (!file && !editRequest?.attachment_path) {
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

        if (!id) return;

        const totalAmount = calculateTotalAmount();
        const { id: toastId } = toast.loading({ title: t('toast.updating') });
        
        try {
            setLoading(true);

            const apiItems = items.map(item => ({
                id: item.id,
                description: item.description || formData.title,
                amount: Number.parseFloat(item.amount),
                category: item.category,
                item_date: item.item_date,
            }));

            await updateTreasury({
                id: parseInt(id),
                type: formData.type,
                title: formData.title,
                description: formData.description,
                amount: totalAmount,
                request_date: items[0]?.item_date || new Date().toISOString().split('T')[0],
                items: apiItems,
            });

            if (file) {
                await uploadTreasuryAttachment({
                    treasury_request_id: parseInt(id),
                    file,
                });
            }

            toast.success({ itemID: toastId, title: t('toast.updated') });
            navigate('/treasury');
        } catch (err) {
            toast.error(err, { itemID: toastId, title: t('toast.failedUpdate') });
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

    if (loadingRequest) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-1">
                        <Button variant="ghost" size="icon" onClick={handleCancelClick} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{t('form.editRequest')}</h1>
                            <p className="text-muted-foreground">
                                {t('form.editRequestDesc')}
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
                            existingAttachment={editRequest?.attachment_path ? {
                                name: editRequest.attachment_original_name || 'Attachment',
                                path: editRequest.attachment_path,
                            } : null}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="outline" onClick={handleCancelClick}>
                                {t('form.cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t('form.updateRequest')}
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
                        <AlertDialogTitle>{t('dialogs.updateTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dialogs.updateDesc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('form.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit}>
                            {t('dialogs.update')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
