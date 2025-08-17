// middlewares/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import { canManageRole } from "../utils/rolePermissions";

// ใช้ใน router โดยส่ง targetRole ที่ต้องการจัดการ
export function checkPermission(action: "create" | "update" | "delete") {
    return (req: Request, res: Response, next: NextFunction) => {
        const { role: currentUserRole } = req.body; // role ของผู้ที่ login อยู่
        let targetRole: string | undefined;

        // กำหนด role ของ target user ที่จะจัดการ
        if (action === "create") {
            targetRole = req.body.role; // role ใหม่ที่กำลังจะสร้าง
        } else if (action === "update") {
            targetRole = req.body.newRole || req.body.currentRole; // role ใหม่ที่กำลังจะเปลี่ยน หรือ role เดิม
        } else if (action === "delete") {
            targetRole = req.body.targetRole; // role ของ user ที่จะถูกลบ (ควรส่งมาจาก client)
        }

        if (!targetRole) {
            return res.status(400).json({ message: "Target role is required." });
        }

        if (!canManageRole(currentUserRole, targetRole)) {
            return res.status(403).json({ message: `Permission denied. ${currentUserRole} cannot ${action} ${targetRole}.` });
        }

        next();
    };
}
