// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import User from '../models/User';

// ขยาย type ของ payload ให้ตรงกับสิ่งที่ encode ใน JWT
interface JwtPayload extends DefaultJwtPayload {
    userId: string;
}

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifyToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token payload' });
        }

        // หาว่า user ยังอยู่ใน DB ไหม
        const user = await User.findById(decoded.userId);

        if (!user) {
            // ✅ ตรงนี้จะ handle กรณีที่ user ถูกลบออกจาก DB แล้ว
            return res.status(401).json({ success: false, message: 'User not found. Please login again.' });
        }

        // แนบ user เข้า req (เผื่อ controller ใช้งานต่อ)
        req.user = user;

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }

        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
