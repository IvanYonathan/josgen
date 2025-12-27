import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { expense_categories, TreasuryRequest } from '@/types/treasury/treasury';
import { createTreasury, updateTreasury, uploadTreasuryAttachment, deleteTreasuryAttachment } from '@/lib/api/treasury';

interface CreateRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editRequest?: TreasuryRequest | null;
}

interface FieldErrors {
    title?: string;
    description?: string;
    amount?: string;
    category?: string;
    request_date?: string;
}

export function CreateRequestDialog({ open, onOpenChange, onSuccess, editRequest }: CreateRequestDialogProps) {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        type: 'reimbursement' as 'fund_request' | 'reimbursement',
        title: '',
        description: '',
        amount: '',
        category: '',
        request_date: new Date().toISOString().split('T')[0],
    });
    const [errors, setErrors] = useState<FieldErrors>({});
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const isEditMode = !!editRequest;

    // Track if form has been modified
    const hasChanges = () => {
        if (!isEditMode) {
            // For new requests, check if any field has been filled
            return formData.title || formData.description || formData.amount || formData.category || file !== null;
        }
        // For edit mode, check if anything changed from original
        return (
            formData.title !== editRequest?.title ||
            formData.description !== (editRequest?.description || '') ||
            formData.amount !== String(editRequest?.amount) ||
            formData.category !== (editRequest?.items?.[0]?.category || '') ||
            formData.type !== editRequest?.type ||
            file !== null
        );
    };

    // Populate form when editing
    useEffect(() => {
        if (editRequest && open) {
            setFormData({
                type: editRequest.type,
                title: editRequest.title,
                description: editRequest.description || '',
                amount: String(editRequest.amount),
                category: editRequest.items?.[0]?.category || '',
                request_date: editRequest.request_date?.split('T')[0] || new Date().toISOString().split('T')[0],
            });
            setFile(null);
            setErrors({});
        } else if (!open) {
            resetForm();
        }
    }, [editRequest, open]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            const selectedFile = selectedFiles[0];
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File exceeds 10MB limit', { duration: 5000 });
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const droppedFile = droppedFiles[0];
            if (droppedFile.size > 10 * 1024 * 1024) {
                toast.error('File exceeds 10MB limit', { duration: 5000 });
                return;
            }
            setFile(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = () => {
        setFile(null);
    };

    const resetForm = () => {
        setFormData({
            type: 'reimbursement',
            title: '',
            description: '',
            amount: '',
            category: '',
            request_date: new Date().toISOString().split('T')[0],
        });
        setFile(null);
        setErrors({});
    };

    const validateForm = (): boolean => {
        const newErrors: FieldErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        if (!formData.request_date) {
            newErrors.request_date = 'Date is required';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill in all required fields', { duration: 5000 });
            return false;
        }

        return true;
    };



    const uploadFile = async (requestId: number) => {
        if (!file) return;

        try {
            await uploadTreasuryAttachment({
                treasury_request_id: requestId,
                file,
            });
            toast.success('File uploaded successfully');
        } catch (err: any) {
            console.error('Failed to upload file:', file.name, err);
            const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
            toast.error(`Failed to upload ${file.name}: ${errorMsg}`, { duration: 5000 });
        }
    };

    const handleSubmitClick = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Show confirmation dialog
        setShowSubmitConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setShowSubmitConfirm(false);

        try {
            setLoading(true);
            let requestId: number;

            if (isEditMode && editRequest) {
                // Update existing request
                const result = await updateTreasury({
                    id: editRequest.id,
                    type: formData.type,
                    title: formData.title,
                    description: formData.description,
                    amount: parseFloat(formData.amount),
                    request_date: formData.request_date,
                    items: [{
                        description: formData.title,
                        amount: parseFloat(formData.amount),
                        category: formData.category,
                    }],
                });
                requestId = result.request.id;

                // For rejected requests with new file, delete old attachment first
                if (editRequest.status === 'rejected' && file && editRequest.attachment_path) {
                    console.log('Deleting old attachment for rejected request');
                    try {
                        await deleteTreasuryAttachment(editRequest.id);
                        console.log('Deleted old attachment');
                    } catch (err) {
                        console.error('Failed to delete old attachment:', err);
                    }
                }

                // Upload new file if any
                await uploadFile(requestId);

                toast.success('Request updated successfully');
            } else {
                // Create new request and submit immediately
                const result = await createTreasury({
                    type: formData.type,
                    title: formData.title,
                    description: formData.description,
                    amount: parseFloat(formData.amount),
                    request_date: formData.request_date,
                    items: [{
                        description: formData.title,
                        amount: parseFloat(formData.amount),
                        category: formData.category,
                    }],
                    submit: true, // Submit immediately
                });
                requestId = result.request.id;

                // Upload files after creation
                await uploadFile(requestId);

                toast.success('Request submitted successfully');
            }

            onOpenChange(false);
            resetForm();
            onSuccess();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} request`, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (hasChanges()) {
            setShowCancelConfirm(true);
        } else {
            onOpenChange(false);
        }
    };

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false);
        onOpenChange(false);
        resetForm();
    };

    // Clear field error when user starts typing
    const clearError = (field: keyof FieldErrors) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => {
                if (!isOpen && hasChanges()) {
                    setShowCancelConfirm(true);
                } else {
                    onOpenChange(isOpen);
                }
            }}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Request' : 'Submit New Request'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? 'Update your treasury request details.'
                                : 'Create a new treasury request for reimbursement or funding.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitClick} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="flex items-center gap-1">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Office supplies purchase"
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
                                <Label htmlFor="type">Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="reimbursement">Reimbursement</SelectItem>
                                        <SelectItem value="fund_request">Fund Request</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-1">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide details about your request..."
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

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="flex items-center gap-1">
                                    Amount <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="amount"
                                    type="text"
                                    placeholder="0"
                                    value={formData.amount ? formData.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                                    onChange={(e) => {
                                        // Remove all non-numeric characters except the value
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
                                <Label htmlFor="category" className="flex items-center gap-1">
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
                                        {Object.entries(expense_categories).map(([key, label]) => (
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
                            <div className="space-y-2">
                                <Label htmlFor="date" className="flex items-center gap-1">
                                    Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.request_date}
                                    onChange={(e) => {
                                        setFormData({ ...formData, request_date: e.target.value });
                                        clearError('request_date');
                                    }}
                                    className={errors.request_date ? 'border-red-500' : ''}
                                />
                                {errors.request_date && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {errors.request_date}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Attachments (Proof/Bills)</Label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div
                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PDF, PNG, JPG up to 10MB
                                </p>
                            </div>

                            {file && (
                                <div className="mt-3">
                                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4" />
                                            <span className="truncate max-w-[300px]">{file.name}</span>
                                            <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={handleCancelClick}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {isEditMode ? 'Update Request' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
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
                        <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? 'Update Request?' : 'Submit Request?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEditMode
                                ? 'Are you sure you want to update this request? The changes will be saved.'
                                : 'Are you sure you want to submit this request? It will be sent for approval.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmit}>
                            {isEditMode ? 'Update' : 'Submit'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
