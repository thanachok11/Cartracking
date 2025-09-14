import { Response } from "express";
import User from "../models/User";
import { AuthenticatedRequest } from "../Middleware/authMiddleware";


// ================= ดึง allowedPages ของผู้ใช้ =================
export const getAllowedPages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { targetUserId } = req.query;
        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ allowedPages: user.allowedPages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get allowed pages", error });
    }
};

// ================= อัปเดต allowedPages ของผู้ใช้ =================
export const updateAllowedPages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const currentUserRole = req.user?.role?.toLowerCase();
        if (!["admin", "super admin"].includes(currentUserRole || "")) {
            return res.status(403).json({ message: "Forbidden: เฉพาะ admin/super admin เท่านั้น" });
        }

        const { targetUserId, allowedPages } = req.body;
        if (!targetUserId || !Array.isArray(allowedPages)) {
            return res.status(400).json({ message: "Missing targetUserId or allowedPages (must be an array)" });
        }

        const user = await User.findById(targetUserId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.allowedPages = allowedPages;
        await user.save();

        res.status(200).json({
            message: "Allowed pages updated successfully",
            allowedPages: user.allowedPages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update allowed pages", error });
    }
};

