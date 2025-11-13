import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RolePermission } from '@/types/role/role';
import { useTranslation } from '@/hooks/use-translation';

interface PermissionSelectorProps {
  permissions: RolePermission[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  permissions,
  value,
  onChange,
  disabled = false,
}: Readonly<PermissionSelectorProps>) {
  const { t } = useTranslation('role');
  const [search, setSearch] = useState('');

  const normalizedValue = value ?? [];

  const filteredPermissions = useMemo(() => {
    if (!search.trim()) {
      return permissions;
    }

    const term = search.trim().toLowerCase();
    return permissions.filter((permission) =>
      permission.name.toLowerCase().includes(term)
    );
  }, [permissions, search]);

  const togglePermission = (permission: string, checked: boolean) => {
    if (checked && !normalizedValue.includes(permission)) {
      onChange([...normalizedValue, permission]);
      return;
    }

    if (!checked) {
      onChange(normalizedValue.filter((item) => item !== permission));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder={t('permissions.search')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        disabled={disabled || permissions.length === 0}
      />
      <div className="max-h-64 overflow-y-auto rounded border border-border">
        {filteredPermissions.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            {t('permissions.empty')}
          </div>
        ) : (
          filteredPermissions.map((permission) => (
            <label
              key={permission.id}
              className="flex items-center gap-3 border-b border-border/60 p-3 last:border-b-0"
            >
              <Checkbox
                checked={normalizedValue.includes(permission.name)}
                onCheckedChange={(checked) =>
                  togglePermission(permission.name, checked === true)
                }
                disabled={disabled}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">{permission.name}</p>
                <p className="text-xs text-muted-foreground">{permission.guard_name}</p>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
