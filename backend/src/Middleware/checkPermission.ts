import { Request, Response, NextFunction } from "express";
import { canManageRole } from "../utils/rolePermissions";
import User from "../models/User";
import jwt from "jsonwebtoken";

export function checkPermission(action: "create" | "update" | "delete") {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "No token provided" });
            }

            const token = authHeader.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

            const currentUserId = decoded.userId;
            const currentUserRole = decoded.role.toLowerCase();

            let targetUserRole: string | undefined;

            if (action === "create") {
                targetUserRole = req.body.role?.trim().toLowerCase();
                if (!targetUserRole) {
                    return res.status(400).json({ message: "Target role is required for create" });
                }

                // ตรวจสอบ permission สำหรับ create
                if (!canManageRole(currentUserRole, targetUserRole)) {
                    return res.status(403).json({
                        message: `Permission denied. ${currentUserRole} cannot create ${targetUserRole}.`,
                    });
                }

            } else {
                const { userId, newRole } = req.body;

                if (!userId) {
                    return res.status(400).json({ message: "User ID is required" });
                }

                if (userId === currentUserId && action === "delete") {
                    return res.status(400).json({ message: "Cannot delete your own account" });
                }

                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    return res.status(404).json({ message: "Target user not found" });
                }

                targetUserRole = targetUser.role?.trim().toLowerCase();
                if (!targetUserRole) {
                    return res.status(400).json({ message: "Target user role not found" });
                }

                // ตรวจสอบ permission สำหรับ update
                if (action === "update") {
                    // ถ้ามี newRole → ตรวจสอบ permission กับ targetUser ปัจจุบัน
                    if (newRole && !canManageRole(currentUserRole, targetUserRole)) {
                        return res.status(403).json({
                            message: `Permission denied. ${currentUserRole} cannot update ${targetUserRole}.`,
                        });
                    }
                }

                // ตรวจสอบ permission สำหรับ delete
                if (action === "delete") {
                    if (!canManageRole(currentUserRole, targetUserRole)) {
                        return res.status(403).json({
                            message: `Permission denied. ${currentUserRole} cannot delete ${targetUserRole}.`,
                        });
                    }
                }
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: "Permission check failed", error });
        }
    };
}
