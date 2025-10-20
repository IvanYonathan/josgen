import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/user/user";

interface UserAvatarProps {
    user: User;
    className?: string;
}

const STORAGE_BASE_URL = (() => {
    const trimTrailingSlash = (input: string) => input.replace(/\/+$/, '');

    const explicit = import.meta.env.VITE_STORAGE_BASE_URL as string | undefined;
    if (explicit) {
        return trimTrailingSlash(explicit);
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (apiBase) {
        try {
            const resolved = new URL(apiBase, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
            return trimTrailingSlash(resolved.origin);
        } catch {
            if (apiBase.startsWith('http')) {
                return trimTrailingSlash(apiBase.replace(/\/api\/?$/, ''));
            }
        }
    }

    if (typeof window !== 'undefined') {
        return trimTrailingSlash(window.location.origin);
    }

    return undefined;
})();

export function resolveAvatarSrc(value?: string | null): string | undefined {
    if (!value) return undefined;
    if (value.startsWith('data:image') || value.startsWith('http')) {
        return value;
    }

    const directStorageMatch = value.match(/^\/?storage\/(.+)/i);
    if (directStorageMatch) {
        return STORAGE_BASE_URL
            ? `${STORAGE_BASE_URL}/storage/${directStorageMatch[1]}`
            : `/${directStorageMatch[0].replace(/^\/+/, '')}`;
    }

    const normalized = value
        .replace(/\\/g, '/')
        .replace(/^\/?storage\/?/, '')
        .replace(/^public\/?/, '')
        .replace(/^avatars\//, '');
    const path = `avatars/${normalized}`;

    if (!STORAGE_BASE_URL) {
        return `/storage/${path}`;
    }

    return `${STORAGE_BASE_URL}/storage/${path}`;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const resolvedSrc = resolveAvatarSrc(user.ava) ?? resolveAvatarSrc(user.avatar);

  return (
    <Avatar
      className={`overflow-hidden rounded-full bg-muted flex items-center justify-center ${className}`}
    >
      <AvatarImage
        src={resolvedSrc}
        alt={user.name}
        className="object-cover w-full h-full"
      />
      <AvatarFallback className="text-sm font-semibold bg-slate-700 text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

