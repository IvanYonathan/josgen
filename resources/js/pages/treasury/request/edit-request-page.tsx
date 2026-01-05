import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTreasury, updateTreasury, uploadTreasuryAttachment } from '@/lib/api/treasury';
import { TreasuryRequest } from '@/types/treasury/treasury';
import { RequestForm, RequestFormData, ItemInput, FieldErrors, createEmptyItem } from './request-form';

export function EditRequestPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();

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
            toast.error(err, { title: 'Failed to load request' });
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
            newErrors.title = 'Title is required';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        const itemErrors: { [index: number]: { description?: string; amount?: string; category?: string; item_date?: string } } = {};
        items.forEach((item, index) => {
            const errs: { description?: string; amount?: string; category?: string; item_date?: string } = {};
            if (!item.amount || Number.parseFloat(item.amount) <= 0) {
                errs.amount = 'Amount must be greater than 0';
            }
            if (!item.category) {
                errs.category = 'Category is required';
            }
            if (!item.item_date) {
                errs.item_date = 'Date is required';
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
            newErrors.attachment = 'Attachment is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error(new Error('Please fill in all required fields'), { title: 'Validation error' });
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
        const { id: toastId } = toast.loading({ title: 'Updating request...' });
        
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

            toast.success({ itemID: toastId, title: 'Request updated successfully' });
            navigate('/treasury');
        } catch (err) {
            toast.error(err, { itemID: toastId, title: 'Failed to update request' });
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
                            <h1 className="text-2xl font-bold">Edit Request</h1>
                            <p className="text-muted-foreground">
                                Update your treasury request details.
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
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Update Request
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate('/treasury')} className="bg-red-600 hover:bg-red-700">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to update this request? The changes will be saved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit}>
                            Update
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
