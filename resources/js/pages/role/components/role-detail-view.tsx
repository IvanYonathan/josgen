import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { Role } from '@/types/role/role';
import { Loader2, ArrowLeft, Shield, ShieldAlert, Users, Trash2 } from 'lucide-react';
import { formatRoleLabel } from '@/lib/utils/role-label';
import { resolveAvatarSrc } from '@/components/user/user-avatar';

interface RoleDetailViewProps {
  role: Role | null;
  users: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    ava?: string | null;
  }>;
  loading: boolean;
  error: string | null;
  canDeleteRole: boolean;
  onBack: () => void;
  onDelete: (role: Role) => void;
}

export function RoleDetailView({
  role,
  users,
  loading,
  error,
  canDeleteRole,
  onBack,
  onDelete,
}: Readonly<RoleDetailViewProps>) {
  const { t } = useTranslation('role');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('buttons.backToList')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {role ? formatRoleLabel(role.name) : t('detail.title')}
            </h1>
            {role?.is_protected && (
              <Badge variant="secondary" className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase">
                <ShieldAlert className="h-3 w-3" />
                {t('detail.protected')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : role ? (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.information')}</CardTitle>
                <CardDescription>{t('detail.informationDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded border p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{role.guard_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('detail.guard')}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">
                    {t('detail.permissions')} ({role.permissions?.length ?? 0})
                  </p>
                  {role.permissions && role.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-xs font-normal">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('detail.noPermissions')}</p>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {t('detail.metadata.created')}: {new Date(role.created_at).toLocaleString()}
                  </p>
                  <p>
                    {t('detail.metadata.updated')}: {new Date(role.updated_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {t('detail.assignedUsers')}
                    </CardTitle>
                    <CardDescription>
                      {t('detail.assignedUsersDescription', { count: users.length })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{users.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => {
                      const avatarSrc = resolveAvatarSrc(user.ava) ?? resolveAvatarSrc(user.avatar);
                      return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded border p-3 hover:bg-accent/50 transition-colors"
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('detail.noAssignedUsers')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('table.actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={!canDeleteRole || role.is_protected}
                  onClick={() => onDelete(role)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('buttons.delete')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {t('detail.noRoleSelected')}
        </div>
      )}
    </div>
  );
}
