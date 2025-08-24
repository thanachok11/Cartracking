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

            if (action === "create") {
                const targetRole = req.body.role?.trim().toLowerCase();
                if (!targetRole) {
                    return res.status(400).json({ message: "Target role is required for create" });
                }

                if (!canManageRole(currentUserRole, targetRole)) {
                    return res.status(403).json({
                        message: `Permission denied. ${currentUserRole} cannot create ${targetRole}.`,
                    });
                }
            } else if (action === "update") {
                const { userId, newRole } = req.body;
                if (!userId) {
                    return res.status(400).json({ message: "User ID is required for update" });
                }

                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    return res.status(404).json({ message: "Target user not found" });
                }

                if (newRole) {
                    const newRoleLower = newRole.trim().toLowerCase();
                    if (!canManageRole(currentUserRole, newRoleLower)) {
                        return res.status(403).json({
                            message: `Permission denied. ${currentUserRole} cannot update role to ${newRoleLower}.`,
                        });
                    }
                }
            } else if (action === "delete") {
                const { userId } = req.body;
                if (!userId) {
                    return res.status(400).json({ message: "User ID is required for delete" });
                }
                if (userId === currentUserId) {
                    return res.status(400).json({ message: "Cannot delete your own account" });
                }

                const targetUser = await User.findById(userId);
                if (!targetUser) {
                    return res.status(404).json({ message: "Target user not found" });
                }

                const targetRole = targetUser.role?.trim().toLowerCase();
                if (!canManageRole(currentUserRole, targetRole)) {
                    return res.status(403).json({
                        message: `Permission denied. ${currentUserRole} cannot delete ${targetRole}.`,
                    });
                }
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: "Permission check failed", error });
        }
    };
}

