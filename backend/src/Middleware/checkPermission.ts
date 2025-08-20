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
                targetRole = req.body.role; // role ใหม่ที่กำลังจะสร้าง
            } else if (action === "update") {
                targetRole = req.body.newRole || req.body.currentRole;
            } else if (action === "delete") {
                const { userId } = req.body; // user ที่จะถูกลบ
                if (!userId) {
                    return res.status(400).json({ message: "User ID is required." });
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
