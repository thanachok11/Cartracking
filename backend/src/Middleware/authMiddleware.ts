// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as DefaultJwtPayload } from "jsonwebtoken";
import User from "../models/User";

// ✅ Payload ที่ encode ตอนสร้าง JWT
interface JwtPayload extends DefaultJwtPayload {
    userId: string;
}

// ✅ Request object ที่มี user, userId, userRole
export interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    userRole?: string;
}

export const verifyToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized: No token provided" });
        }

        // ✅ verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        if (!decoded || !decoded.userId) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized: Invalid token payload" });
        }

        // ✅ หา user ใน DB
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "User not found. Please login again." });
        }

        // ✅ แนบข้อมูล user ไว้ที่ req
        req.user = user;
        req.userId = user._id.toString();
        req.userRole = user.role; // เช่น "super admin", "admin", "manager", "user"

        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ success: false, message: "Token expired. Please login again." });
        }

        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};
