import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateUser } from "@/lib/api/user/update-user";
import { UpdateUserRequest, User, UserRole } from "@/types/user/user";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { resolveAvatarSrc } from "@/components/user/user-avatar";

interface EditUserSheetProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: User) => void;
}

export function EditUserSheet({ user, open, onOpenChange, onUserUpdated }: EditUserSheetProps) {
  const { t } = useTranslation("user");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<UpdateUserRequest>({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    birthday: user.birthday || "",
  });

  useEffect(() => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      birthday: user.birthday || "",
    });

    const existingAvatar = resolveAvatarSrc(user.avatar || user.ava);
    setAvatarPreview(existingAvatar || null);
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await updateUser(formData, avatarFile ?? undefined);
      onUserUpdated(response.user);
      onOpenChange(false);
      toast({
        title: t("success"),
        description: t("update_success"),
      });
    } catch (error: any) {
      setErrors(error.response?.data?.errors || { general: t("update_error") });
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.response?.data?.message || t("update_error"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-full overflow-y-auto p-6 sm:max-w-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("editUser.title")}</SheetTitle>
              <SheetDescription>{t("editUser.description")}</SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 py-4">
              {errors.general && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {errors.general}
                </div>
              )}

              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="name">{t("editUser.form.name.label")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("editUser.form.name.placeholder")}
                  className={errors.name ? "border-red-500" : ""}
                  required
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="email">{t("editUser.form.email.label")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t("editUser.form.email.placeholder")}
                  className={errors.email ? "border-red-500" : ""}
                  required
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="role">{t("editUser.form.role.label")} *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("editUser.form.role.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                   <SelectItem value="Member">{t('editUser.form.role.member')}</SelectItem>
                    <SelectItem value="Division_Leader">{t('editUser.form.role.division_leader')}</SelectItem>
                    <SelectItem value="Treasurer">{t('editUser.form.role.treasurer')}</SelectItem>
                    <SelectItem value="Sysadmin">{t('editUser.form.role.sysadmin')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
              </div>

              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="phone">{t("editUser.form.phone.label")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("editUser.form.phone.placeholder")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="birthday">{t("editUser.form.birthday.label")}</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
                  className={errors.birthday ? "border-red-500" : ""}
                />
                {errors.birthday && <p className="text-sm text-red-600">{errors.birthday}</p>}
              </div>

              <div className="mr-2 mb-2 ml-2 grid gap-2">
                <Label htmlFor="avatar">{t("editUser.form.avatar.label")}</Label>

                {avatarPreview && (
                  <div className="flex justify-center">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
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
                    hover:file:bg-slate-200 focus:ring-2 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 
                    dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700
                  `}
                />

                {(errors.avatar || errors.ava) && (
                  <p className="text-sm text-red-600">{errors.avatar || errors.ava}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <SheetFooter className="mt-auto border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t("editUser.button.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("editUser.button.update")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
