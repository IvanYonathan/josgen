import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { createUser } from '@/lib/api/user/create-user';
import { User } from '@/types/user/user';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, CreateUserFormData, cleanUserFormData } from '../schemas/user-schemas';
import { useUserManagementStore } from '../store/user-management-store';
import { formatRoleLabel } from '@/lib/utils/role-label';
import { DEFAULT_ROLE_SLUGS } from '@/constants/default-roles';

interface CreateUserSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserCreated: (user: User) => void;
}

export function CreateUserSheet({ open, onOpenChange, onUserCreated }: Readonly<CreateUserSheetProps>) {
    const { t } = useTranslation('user');
    const { toast } = useToast();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    const { availableRoles, roleLabels } = useUserManagementStore();
    const roleOptions = useMemo(
        () => (availableRoles.length > 0 ? availableRoles : DEFAULT_ROLE_SLUGS),
        [availableRoles]
    );

    const form = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: '',
            phone: '',
            birthday: '',
        },
    });

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    useEffect(() => {
        if (!open) return;
        const currentRole = form.getValues('role');
        if (!currentRole && roleOptions.length > 0) {
            form.setValue('role', roleOptions[0]);
        }
    }, [open, roleOptions, form]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;

        if (avatarPreview) URL.revokeObjectURL(avatarPreview);

        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        } else {
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    };

    const handleSubmit = form.handleSubmit(async (values) => {
        setServerErrors({});

        try {
            const cleanedData = cleanUserFormData(values);

            const response = await createUser(cleanedData as any, avatarFile ?? undefined);
            onUserCreated(response.user);
            onOpenChange(false);
            toast({
                title: t('success'),
                description: t('create_success'),
            });

            form.reset();
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            setAvatarFile(null);
            setAvatarPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            const errors = error.response?.data?.errors || { general: t('create_error') };
            setServerErrors(errors);
            toast({
                variant: 'destructive',
                title: t('error'),
                description: error.response?.data?.message || t('create_error'),
            });
        }
    });

    const { formState: { errors, isSubmitting } } = form;
    const allErrors = { ...errors, ...serverErrors };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="h-full overflow-y-auto p-6 sm:max-w-md">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>{t('createUser.title')}</SheetTitle>
                            <SheetDescription>{t('createUser.description')}</SheetDescription>
                        </SheetHeader>

                        <div className="grid gap-4 py-4">
                            {serverErrors.general && (
                                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{serverErrors.general}</div>
                            )}

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="name">{t('createUser.form.name.label')} *</Label>
                                <Input
                                    id="name"
                                    {...form.register('name')}
                                    placeholder={t('createUser.form.name.placeholder')}
                                    className={allErrors.name ? 'border-red-500' : ''}
                                />
                                {allErrors.name && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.name === 'string' ? allErrors.name : allErrors.name?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="email">{t('createUser.form.email.label')} *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...form.register('email')}
                                    placeholder={t('createUser.form.email.placeholder')}
                                    className={allErrors.email ? 'border-red-500' : ''}
                                />
                                {allErrors.email && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.email === 'string' ? allErrors.email : allErrors.email?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="password">{t('createUser.form.password.label')} *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...form.register('password')}
                                    placeholder={t('createUser.form.password.placeholder')}
                                    className={allErrors.password ? 'border-red-500' : ''}
                                />
                                {allErrors.password && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.password === 'string' ? allErrors.password : allErrors.password?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="role">{t('createUser.form.role.label')} *</Label>
                                <Controller
                                    name="role"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || undefined}
                                            onValueChange={field.onChange}
                                            disabled={isSubmitting || roleOptions.length === 0}
                                        >
                                            <SelectTrigger className={allErrors.role ? 'border-red-500' : ''}>
                                                <SelectValue placeholder={t('createUser.form.role.placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roleOptions.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {roleLabels[role] ?? formatRoleLabel(role)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {allErrors.role && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.role === 'string' ? allErrors.role : allErrors.role?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="phone">{t('createUser.form.phone.label')}</Label>
                                <Input
                                    id="phone"
                                    {...form.register('phone')}
                                    placeholder={t('createUser.form.phone.placeholder')}
                                    className={allErrors.phone ? 'border-red-500' : ''}
                                />
                                {allErrors.phone && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.phone === 'string' ? allErrors.phone : allErrors.phone?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="birthday">{t('createUser.form.birthday.label')}</Label>
                                <Input
                                    id="birthday"
                                    type="date"
                                    {...form.register('birthday')}
                                    className={allErrors.birthday ? 'border-red-500' : ''}
                                />
                                {allErrors.birthday && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.birthday === 'string' ? allErrors.birthday : allErrors.birthday?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="avatar">{t('createUser.form.avatar.label')}</Label>

                                {avatarPreview && (
                                    <div className="flex justify-center">
                                        <img src={avatarPreview} alt="Avatar preview" className="mb-2 h-24 w-24 rounded-full object-cover" />
                                    </div>
                                )}

                                <input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    ref={fileInputRef}
                                    className={`
                                        focus:ring-ring block w-full cursor-pointer rounded-md border border-slate-300 bg-white text-sm
                                        text-slate-900 file:mr-3 file:rounded-none file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-medium file:text-slate-800
                                        hover:file:bg-slate-200 focus:ring-2 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700`}
                                />

                                {(serverErrors.avatar || serverErrors.ava) && (
                                    <p className="text-sm text-red-600">{serverErrors.avatar || serverErrors.ava}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="mt-auto border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            {t('createUser.button.cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('createUser.button.create')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
