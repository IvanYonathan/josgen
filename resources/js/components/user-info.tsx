import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types/user/user';
import { resolveAvatarSrc } from '@/components/user/user-avatar';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();
    const avatarSrc = resolveAvatarSrc(user?.ava) ?? resolveAvatarSrc(user?.avatar);

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={avatarSrc} alt={user?.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user?.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user?.email}</span>}
            </div>
        </>
    );
}
