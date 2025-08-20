// middlewares/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import { canManageRole } from "../utils/rolePermissions";
import User from "../models/User";

export function checkPermission(action: "create" | "update" | "delete") {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { role: currentUserRole, currentUserId } = req.body;
        let targetRole: string | undefined;

        try {
            if (action === "create") {
                // 🎯 role ที่กำลังจะสร้าง (เช่น admin จะสร้าง manager)
                targetRole = req.body.role;
            } else if (action === "update") {
                const { userId, newRole } = req.body;
                if (!userId) {
                    return res.status(400).json({ message: "User ID is required for update." });
                }

                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    return res.status(404).json({ message: "Target user not found." });
                }

                // ถ้ามี newRole = role ที่จะเปลี่ยน, ถ้าไม่มีใช้ role ปัจจุบัน
                targetRole = newRole || targetUser.role;
            } else if (action === "delete") {
                const { userId } = req.body;
                if (!userId) {
                    return res.status(400).json({ message: "User ID is required for delete." });
                }

                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    return res.status(404).json({ message: "Target user not found." });
                }

                targetRole = targetUser.role;
            }

            if (!targetRole) {
                return res.status(400).json({ message: "Target role is required." });
            }

            if (!canManageRole(currentUserRole, targetRole)) {
                return res.status(403).json({
                    message: `Permission denied. ${currentUserRole} cannot ${action} ${targetRole}.`,
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: "Permission check failed", error });
        }
    };
}
