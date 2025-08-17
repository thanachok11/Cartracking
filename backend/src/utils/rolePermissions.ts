// utils/rolePermissions.ts

// mapping ว่า role ไหน จัดการ role อะไรได้บ้าง
const rolePermissions: Record<string, string[]> = {
    super_admin: ["user", "viewer", "manager", "admin", "super_admin"],
    admin: ["user", "viewer", "manager"],
    manager: ["user", "viewer"],
};

export function canManageRole(currentRole: string, targetRole: string): boolean {
    // ถ้าไม่มีสิทธิ์ หรือ role ไม่ถูกต้อง → false
    if (!rolePermissions[currentRole]) return false;
    return rolePermissions[currentRole].includes(targetRole);
}
