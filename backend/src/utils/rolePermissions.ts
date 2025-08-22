const roleMap: Record<number, string> = {
    1: "viewer",
    2: "user",
    3: "manager",
    4: "admin"
};

const rolePermissions: Record<string, string[]> = {
    "super admin": ["user", "viewer", "manager", "admin"],
    "admin": ["user", "viewer", "manager"],
    "manager": ["user", "viewer"],
    "viewer": [],
    "user": []
};

export function canManageRole(currentRole: string | number, targetRole: string | number): boolean {
    if (!currentRole || !targetRole) return false;

    // แปลงเลขเป็น string role
    const normalizedCurrent =
        typeof currentRole === "number" ? roleMap[currentRole] : currentRole.trim().toLowerCase();
    const normalizedTarget =
        typeof targetRole === "number" ? roleMap[targetRole] : targetRole.trim().toLowerCase();

    if (!normalizedCurrent || !normalizedTarget) return false;
    if (!rolePermissions[normalizedCurrent]) return false;

    // ป้องกันไม่ให้ role เดียวกันจัดการกันเอง
    if (normalizedCurrent === normalizedTarget) return false;

    return rolePermissions[normalizedCurrent].includes(normalizedTarget);
}
