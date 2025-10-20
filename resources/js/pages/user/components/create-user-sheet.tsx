import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { createUser } from '@/lib/api/user/create-user';
import { CreateUserRequest, User, UserRole } from '@/types/user/user';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateUserSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserCreated: (user: User) => void;
}

export function CreateUserSheet({ open, onOpenChange, onUserCreated }: CreateUserSheetProps) {
    const { t } = useTranslation('user');
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState<CreateUserRequest>({
        name: '',
        email: '',
        password: '',
        role: 'Member',
        phone: '',
        birthday: '',
    });

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const newUser = await createUser(formData, avatarFile ?? undefined);
            onUserCreated(newUser);
            onOpenChange(false);
            toast({
                title: 'Success',
                description: t('create_success'),
            });

            // Reset
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'Member',
                phone: '',
                birthday: '',
            });
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            setAvatarFile(null);
            setAvatarPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            setErrors(error.response?.data?.errors || { general: t('create_error') });
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || t('create_error'),
            });
        } finally {
            setLoading(false);
        }
    };

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
                            {errors.general && (
                                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{errors.general}</div>
                            )}

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="name">{t('createUser.form.name.label')} *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder={t('createUser.form.name.placeholder')}
                                    className={errors.name ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="email">{t('createUser.form.email.label')} *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder={t('createUser.form.email.placeholder')}
                                    className={errors.email ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="password">{t('createUser.form.password.label')} *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder={t('createUser.form.password.placeholder')}
                                    className={errors.password ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="role">{t('createUser.form.role.label')} *</Label>
                                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData((prev) => ({ ...prev, role: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('createUser.form.role.placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Member">{t('member')}</SelectItem>
                                        <SelectItem value="Division_Leader">{t('division_leader')}</SelectItem>
                                        <SelectItem value="Treasurer">{t('treasurer')}</SelectItem>
                                        <SelectItem value="Sysadmin">{t('sysadmin')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="phone">{t('createUser.form.phone.label')}</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
                                    }
                                    placeholder={t('createUser.form.phone.placeholder')}
                                    className={errors.phone ? 'border-red-500' : ''}
                                />
                                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="birthday">{t('createUser.form.birthday.label')}</Label>
                                <Input
                                    id="birthday"
                                    type="date"
                                    value={formData.birthday}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            birthday: e.target.value,
                                        }))
                                    }
                                    className={errors.birthday ? 'border-red-500' : ''}
                                />
                                {errors.birthday && <p className="text-sm text-red-600">{errors.birthday}</p>}
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

                                {(errors.avatar || errors.ava) && <p className="text-sm text-red-600">{errors.avatar || errors.ava}</p>}
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="mt-auto border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            {t('createUser.button.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('createUser.button.create')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
