import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ฟังก์ชันสำหรับการดึงข้อมูลผู้ใช้ทั้งหมด
export const showAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // ค้นหาผู้ใช้ทั้งหมดจากฐานข้อมูล
        const users = await User.find();

        // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไปในรูปแบบ JSON
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve users', error });
    }
};


// ฟังก์ชันสำหรับการลงทะเบียน
export const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }] });
        if (existingUser) {
            if (existingUser.email === email) {
                res.status(400).json({ message: 'อีเมลนี้ มีผู้ใช้อยู่ในระบบแล้ว' });
                return;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'user', // เปลี่ยนจาก 'admin' เป็น 'user' เป็นค่าเริ่มต้น
            profile_img: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg', // กำหนด profile_img
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        console.log('User found:', user);

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Incorrect password' });
            return;
        }

        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            firstname: user.firstName,
            lastname: user.lastName,
            username: user.username,
            role: user.role,
            profile_img: user.profile_img,
        }, process.env.JWT_SECRET as string, { expiresIn: '30m' });

        res.status(200).json({
            message: 'Login successful',
            token,
            role: user.role,
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error });
    }
};

export const renewToken = async (req: Request, res: Response): Promise<void> => {
    try {
        // ดึง token เก่าจาก header หรือ body (แล้วแต่ design)
        const oldToken = req.headers.authorization?.split(" ")[1] || req.body.token;

        if (!oldToken) {
            res.status(401).json({ message: "No token provided" });
            return;
        }

        // verify token แบบ ignore expiration เพื่อตรวจสอบ payload
        let decoded: any;
        try {
            decoded = jwt.verify(oldToken, process.env.JWT_SECRET as string, { ignoreExpiration: true });
        } catch (err) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        // หา user จาก decoded token
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // สร้าง token ใหม่ (renew)
        const newToken = jwt.sign({
            userId: user._id,
            email: user.email,
            firstname: user.firstName,
            lastname: user.lastName,
            username: user.username,
            role: user.role,
            profile_img: user.profile_img,
        }, process.env.JWT_SECRET as string, { expiresIn: "30m" });

        res.status(200).json({ message: "Token renewed successfully", token: newToken });
    } catch (error) {
        console.error("Error renewing token:", error);
        res.status(500).json({ message: "Failed to renew token", error });
    }
};
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, role: newUserRole } = req.body;
    const { role: currentUserRole } = req.body; // role ของผู้ที่กำลังสร้าง user

    try {
        // super_admin, admin, manager เท่านั้นที่สร้าง user ได้
        if (!['super_admin', 'admin', 'manager'].includes(currentUserRole)) {
            res.status(403).json({ message: 'Permission denied. Only super_admin, admin, or manager can create users.' });
            return;
        }

        // manager → สร้างได้แค่ user, viewer
        if (currentUserRole === 'manager' && !['user', 'viewer'].includes(newUserRole)) {
            res.status(403).json({ message: 'Permission denied. Manager can only create user or viewer accounts.' });
            return;
        }

        // admin → สร้างได้แค่ user, viewer, manager
        if (currentUserRole === 'admin' && !['user', 'viewer', 'manager'].includes(newUserRole)) {
            res.status(403).json({ message: 'Permission denied. Admin cannot create admin or super_admin accounts.' });
            return;
        }

        const validRoles = ['user', 'viewer', 'manager', 'admin', 'super_admin'];
        if (!validRoles.includes(newUserRole)) {
            res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'อีเมลนี้ มีผู้ใช้อยู่ในระบบแล้ว' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: newUserRole,
            profile_img: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg',
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully', 
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                profile_img: newUser.profile_img
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user', error });
    }
};


// อัปเดต user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const { userId, firstName, lastName, email, newRole, role: currentUserRole } = req.body;

    try {
        if (!['super_admin', 'admin', 'manager'].includes(currentUserRole)) {
            res.status(403).json({ message: 'Permission denied. Only super_admin, admin, or manager can update users.' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // manager ห้ามแก้ไข admin, manager, super_admin
        if (currentUserRole === 'manager' && ['admin', 'manager', 'super_admin'].includes(user.role)) {
            res.status(403).json({ message: 'Permission denied. Manager cannot update admin, manager, or super_admin accounts.' });
            return;
        }

        // admin ห้ามแก้ไข admin, super_admin
        if (currentUserRole === 'admin' && ['admin', 'super_admin'].includes(user.role)) {
            res.status(403).json({ message: 'Permission denied. Admin cannot update other admin or super_admin accounts.' });
            return;
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: 'อีเมลนี้ มีผู้ใช้อยู่ในระบบแล้ว' });
                return;
            }
        }

        if (newRole) {
            const validRoles = ['user', 'viewer', 'manager', 'admin', 'super_admin'];
            if (!validRoles.includes(newRole)) {
                res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
                return;
            }

            // manager ห้ามอัปเดตเป็น admin, manager, super_admin
            if (currentUserRole === 'manager' && ['admin', 'manager', 'super_admin'].includes(newRole)) {
                res.status(403).json({ message: 'Permission denied. Manager cannot assign admin, manager, or super_admin roles.' });
                return;
            }

            // admin ห้ามอัปเดตเป็น admin, super_admin
            if (currentUserRole === 'admin' && ['admin', 'super_admin'].includes(newRole)) {
                res.status(403).json({ message: 'Permission denied. Admin cannot assign admin or super_admin roles.' });
                return;
            }
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        if (newRole) user.role = newRole;

        await user.save();

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profile_img: user.profile_img
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user', error });
    }
};


// ลบ user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { userId, role: currentUserRole, currentUserId } = req.body;

    try {
        if (!['super_admin', 'admin', 'manager'].includes(currentUserRole)) {
            res.status(403).json({ message: 'Permission denied. Only super_admin, admin, or manager can delete users.' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (currentUserRole === 'manager' && ['admin', 'manager', 'super_admin'].includes(user.role)) {
            res.status(403).json({ message: 'Permission denied. Manager cannot delete admin, manager, or super_admin accounts.' });
            return;
        }

        if (currentUserRole === 'admin' && ['admin', 'super_admin'].includes(user.role)) {
            res.status(403).json({ message: 'Permission denied. Admin cannot delete other admin or super_admin accounts.' });
            return;
        }

        if (userId === currentUserId) {
            res.status(400).json({ message: 'Cannot delete your own account' });
            return;
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error });
    }
};



export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }

        // สร้าง token สำหรับ reset password
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpire = Date.now() + 15 * 60 * 1000; // หมดอายุใน 15 นาที

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpire;
        await user.save();

        // ลิงก์สำหรับ reset
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // ส่งอีเมล (ใช้ nodemailer)
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });

        res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Error sending reset email", error });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // ตรวจสอบว่ายังไม่หมดอายุ
        });

        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }

        // hash รหัสผ่านใหม่
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // ล้าง token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Error resetting password", error });
    }
};
