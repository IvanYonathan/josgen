import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/types/user/user';
import { Link } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { AuthService } from '@/lib/auth/auth-service';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { t } = useTranslation('sidebar');

    const handleLogout = async () => {
        cleanup();
        try {
            await AuthService.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
        window.location.href = '/login';
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full cursor-pointer" to="/settings/profile" onClick={cleanup}>
                        <Settings className="mr-2" />
                        {t('settings')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button className="w-full cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    {t('logOut')}
                </button>
            </DropdownMenuItem>
        </>
    );
}
