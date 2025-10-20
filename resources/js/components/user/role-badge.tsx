import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user/user";

interface RoleBadgeProps {
    role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    const variants: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
        Sysadmin: "destructive",
        Division_Leader: "secondary",
        Treasurer: "outline",
        Member: "default",
    };

    const displayNames: Record<UserRole, string> = {
        Sysadmin: "System Admin",
        Division_Leader: "Division Leader",
        Treasurer: "Treasurer",
        Member: "Member",
    };

    return (
        <Badge variant={variants[role]}>
            {displayNames[role]}
        </Badge>
    );
}
