const rolePermissions: Record<string, string[]> = {
    "super admin": ["user", "viewer", "manager", "admin"],
    "admin": ["user", "viewer", "manager"],
    "manager": ["user", "viewer"],
    "viewer": [],
    "user": []
};

export function canManageRole(currentRole: string, targetRole: string): boolean {
    if (!currentRole || !targetRole) return false;

    const normalizedCurrent = currentRole.toLowerCase();
    const normalizedTarget = targetRole.toLowerCase();

    if (!rolePermissions[normalizedCurrent]) return false;

    return rolePermissions[normalizedCurrent].includes(normalizedTarget);
}
