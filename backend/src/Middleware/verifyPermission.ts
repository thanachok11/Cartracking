import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const verifyPermission = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ message: "No token provided" });
            }

            const token = authHeader.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            const role = (user.role || "").toLowerCase();

            if (!allowedRoles.includes(role)) {
                // กรอง super admin ออกจากข้อความ
                const visibleRoles = allowedRoles.filter(r => r !== "super admin");

                return res.status(403).json({
                    message: `คุณต้องเป็น ${visibleRoles.join(", ")} เท่านั้นถึงจะแก้ไข/ลบได้`,
                });
            }


            // attach user ให้ route ใช้งานต่อได้
            req.user = user;
            next();
        } catch (error) {
            console.error("verifyPermission error:", error);
            return res.status(500).json({ message: "Permission check failed", error });
        }
    };
};
