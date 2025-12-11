import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface User {
  id: number;
  name: string;
}

interface ParticipantSelectorProps {
  users: User[];
  value: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
}

export function ParticipantSelector({
  users,
  value,
  onChange,
  disabled = false,
}: Readonly<ParticipantSelectorProps>) {
  const [search, setSearch] = useState('');

  const normalizedValue = value ?? [];

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const term = search.trim().toLowerCase();
    return users.filter((user) =>
      user.name.toLowerCase().includes(term)
    );
  }, [users, search]);

  const toggleUser = (userId: number, checked: boolean) => {
    if (checked && !normalizedValue.includes(userId)) {
      onChange([...normalizedValue, userId]);
      return;
    }

    if (!checked) {
      onChange(normalizedValue.filter((id) => id !== userId));
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search users..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        disabled={disabled || users.length === 0}
      />
      <div className="max-h-64 overflow-y-auto rounded border border-border">
        {filteredUsers.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-3 border-b border-border/60 p-3 last:border-b-0 hover:bg-accent/50 cursor-pointer"
            >
              <Checkbox
                checked={normalizedValue.includes(user.id)}
                onCheckedChange={(checked) =>
                  toggleUser(user.id, checked === true)
                }
                disabled={disabled}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
