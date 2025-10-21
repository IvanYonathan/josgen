import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types/user/user";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/user/user-avatar";
import { RoleBadge } from "@/components/user/role-badge";
import { EditUserSheet } from "./edit-user-sheet";
import { ArrowLeft, Mail, Phone, Calendar, Building2, CheckCircle2, Edit3 } from "lucide-react";

const formatDate = (iso?: string | null): string => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

interface UserDetailViewProps {
    user: User;
    onUserUpdated: (user: User) => void;
    onBack: () => void;
}

export function UserDetailView({ user, onUserUpdated, onBack }: Readonly<UserDetailViewProps>) {
    const { t } = useTranslation('user');
    const [editSheetOpen, setEditSheetOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Button 
                    variant="ghost" 
                    onClick={onBack} 
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('Back to Users List')}
                </Button>
                <Button 
                    onClick={() => setEditSheetOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Edit3 className="h-4 w-4" />
                    {t('Edit User')}
                </Button>
            </div>

            {/* Main Profile Card */}
            <div className="relative">
                {/* Decorative Background Glow */}
                <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-3xl blur-3xl -z-10"></div>
                
                <Card className="overflow-hidden border-2">
                    {/* Accent Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>
                    
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Avatar Section */}
                            <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300"></div>
                                    <UserAvatar 
                                        user={user} 
                                        className="relative w-32 h-32 ring-4 ring-background shadow-2xl" 
                                    />
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold">
                                        {user.name}
                                    </h2>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>

                            {/* Information Grid */}
                            <div className="md:col-span-2 space-y-3">
                                {/* Email */}
                                <div className="group flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 border border-transparent hover:border-primary/20">
                                    <div className="mt-0.5 p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                            {t('email')}
                                        </p>
                                        <p className="font-medium truncate">{user.email}</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="group flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 border border-transparent hover:border-primary/20">
                                    <div className="mt-0.5 p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                            {t('phone')}
                                        </p>
                                        <p className="font-medium truncate">{user.phone || '-'}</p>
                                    </div>
                                </div>

                                {/* Birthday & Division Row */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    {/* Birthday */}
                                    <div className="group flex items-start gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 border border-transparent hover:border-primary/20">
                                        <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                {t('birthday')}
                                            </p>
                                            <p className="font-medium text-sm truncate">
                                                {formatDate(user.birthday)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Division */}
                                    <div className="group flex items-start gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 border border-transparent hover:border-primary/20">
                                        <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                                {t('division')}
                                            </p>
                                            <p className="font-medium text-sm truncate">
                                                {user.division?.name || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Verified */}
                                {user.email_verified_at && (
                                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-200">
                                        <div className="mt-0.5 p-2.5 rounded-lg bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                                                {t('email_verified')}
                                            </p>
                                            <p className="font-medium truncate">
                                                {formatDate(user.email_verified_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <EditUserSheet 
                user={user}
                open={editSheetOpen}
                onOpenChange={setEditSheetOpen}
                onUserUpdated={onUserUpdated}
            />
        </div>
    );
}