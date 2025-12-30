import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateUser } from "@/lib/api/user/update-user";
import { User} from "@/types/user/user";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from "@/hooks/use-toast";
import { resolveAvatarSrc } from "@/components/user/user-avatar";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema, UpdateUserFormData, cleanUserFormData } from '../schemas/user-schemas';
import { useUserManagementStore } from "../store/user-management-store";
import { DEFAULT_ROLE_SLUGS, LEGACY_ROLE_LABEL_MAP } from "@/constants/default-roles";
import { formatRoleLabel } from "@/lib/utils/role-label";

interface EditUserSheetProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

export function EditUserSheet({ user, open, onOpenChange, onUserUpdated }: Readonly<EditUserSheetProps>) {
  const { t } = useTranslation("user");
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

    const normalizeRoleValue = useCallback(
        (value: string) => {
            if (!value) return value;
            if (roleOptions.includes(value)) {
                return value;
            }

            const match = Object.entries(roleLabels).find(([, label]) => label === value)?.[0];
            if (match) return match;

            if (LEGACY_ROLE_LABEL_MAP[value]) {
                return LEGACY_ROLE_LABEL_MAP[value];
            }

            return value.toLowerCase().replace(/\s+/g, '_');
        },
        [roleLabels, roleOptions]
    );

    const form = useForm<UpdateUserFormData>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: normalizeRoleValue(user.role),
            phone: user.phone || '',
            birthday: user.birthday || '',
            password: '',
        },
    });

    useEffect(() => {
        form.reset({
            id: user.id,
            name: user.name,
            email: user.email,
            role: normalizeRoleValue(user.role),
            phone: user.phone || '',
            birthday: user.birthday || '',
            password: '',
        });

        const existingAvatar = resolveAvatarSrc(user.avatar || user.ava);
        setAvatarPreview(existingAvatar || null);
        setAvatarFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [user, form, normalizeRoleValue]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;

        if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }

        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setAvatarFile(file);
        } else {
            setAvatarFile(null);
            const existingAvatar = resolveAvatarSrc(user.avatar || user.ava);
            setAvatarPreview(existingAvatar || null);
        }
    };

    const handleSubmit = form.handleSubmit(async (values) => {
        setServerErrors({});
        const { id } = toast.loading({ title: t("toast.updating")});

        try {
            // Clean form data (remove empty optional fields)
            const cleanedData = cleanUserFormData(values);

            const response = await updateUser(cleanedData as any, avatarFile ?? undefined);
            onUserUpdated(response.user);
            onOpenChange(false);
            toast.success({ itemID: id, title: t("toast.updateSuccess") });
        } catch (error: any) {
            const errors = error.response?.data?.errors || { general: t("toast.updateError") };
            setServerErrors(errors);
            toast.error(error, { itemID: id, title: t("toast.updateError")});
        }
    });

    const { formState: { errors, isSubmitting } } = form;
    const allErrors = { ...errors, ...serverErrors };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-hidden">
                <SheetHeader>
                    <SheetTitle>{t("editUser.title")}</SheetTitle>
                    <SheetDescription>{t("editUser.description")}</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-simple px-6 py-4">
                        <div className="grid gap-4">
                            {serverErrors.general && (
                                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                    {serverErrors.general}
                                </div>
                            )}

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="name">{t("editUser.form.name.label")} *</Label>
                                <Input
                                    id="name"
                                    {...form.register("name")}
                                    placeholder={t("editUser.form.name.placeholder")}
                                    className={allErrors.name ? "border-red-500" : ""}
                                />
                                {allErrors.name && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.name === 'string' ? allErrors.name : allErrors.name?.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="email">{t("editUser.form.email.label")} *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...form.register('email')}
                                    placeholder={t("editUser.form.email.placeholder")}
                                    className={allErrors.email ? "border-red-500" : ""}
                                />
                                {allErrors.email && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.email === 'string' ? allErrors.email : allErrors.email?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="role">{t("editUser.form.role.label")} *</Label>
                                <Controller
                                    name="role"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || undefined}
                                            onValueChange={field.onChange}
                                            disabled={roleOptions.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("editUser.form.role.placeholder")} />
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
                                <Label htmlFor="phone">{t("editUser.form.phone.label")}</Label>
                                <Input
                                    id="phone"
                                    {...form.register("phone")}
                                    placeholder={t("editUser.form.phone.placeholder")}
                                    className={allErrors.phone ? "border-red-500" : ""}
                                />
                                {allErrors.phone && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.phone === 'string' ? allErrors.phone : allErrors.phone?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="birthday">{t("editUser.form.birthday.label")}</Label>
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
                                <Label htmlFor="password">{t('editUser.form.password.label')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...form.register('password')}
                                    placeholder={t('editUser.form.password.placeholder')}
                                    className={allErrors.password ? 'border-red-500' : ''}
                                />
                                {allErrors.password && (
                                    <p className="text-sm text-red-600">
                                        {typeof allErrors.password === 'string' ? allErrors.password : allErrors.password?.message}
                                    </p>
                                )}
                            </div>

                            <div className="mr-2 mb-2 ml-2 grid gap-2">
                                <Label htmlFor="avatar">{t("editUser.form.avatar.label")}</Label>

                                {avatarPreview && (
                                    <div className="flex justify-center">
                                        <img src={avatarPreview} alt="Avatar preview"
                                        className="mb-2 h-24 w-24 rounded-full object-cover"
                                        />
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

                    <SheetFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            {t("editUser.button.cancel")}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("editUser.button.update")}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
