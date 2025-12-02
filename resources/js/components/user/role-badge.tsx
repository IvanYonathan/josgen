import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/user/user";
import { formatRoleLabel } from "@/lib/utils/role-label";

interface RoleBadgeProps {
    role: UserRole;
}

const VARIANT_MAP: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    sysadmin: "destructive",
    division_leader: "secondary",
    treasurer: "outline",
    member: "default",
};

export function RoleBadge({ role }: RoleBadgeProps) {
    const normalized = role?.toString().toLowerCase();
    const variant = normalized && VARIANT_MAP[normalized] ? VARIANT_MAP[normalized] : "secondary";

    return (
        <Badge variant={variant}>
            {formatRoleLabel(role)}
        </Badge>
    );
}
