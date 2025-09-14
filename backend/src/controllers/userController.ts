import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User, { IUser } from "../models/User";
import { AuthenticatedRequest } from "../Middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import jwt from "jsonwebtoken";

// ================= CREATE USER =================
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, role, allowedPages } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "อีเมลนี้มีผู้ใช้งานอยู่แล้ว" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            isActive: false,
            profile_img:
                "https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg",
            allowedPages: allowedPages || [],
        });

        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                isActive: newUser.isActive,
                role: newUser.role,
                profile_img: newUser.profile_img,
                allowedPages: newUser.allowedPages,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create user", error });
    }
};

// ================= UPDATE USER =================
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user?._id;

        const currentUserRole = req.user?.role?.toLowerCase();
        if (!currentUserId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { targetUserId, firstName, lastName, email, newRole, allowedPages, password } = req.body;

        const idToUpdate = targetUserId || currentUserId;
        const user = await User.findById(idToUpdate);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // ตรวจสอบ role change
        if (newRole) {
            if (!["super admin", "admin"].includes(currentUserRole || "")) {
                res.status(403).json({ message: "Forbidden: เฉพาะ admin/super admin เปลี่ยน role ได้" });
                return;
            }

            // กัน admin ลด role ตัวเอง
            if (currentUserRole === "admin" && String(currentUserId) === String(user._id) && newRole.toLowerCase() !== "admin") {
                res.status(400).json({ message: "Admin ไม่สามารถลด role ของตัวเองได้" });
                return;
            }

            // กัน admin ลด role admin คนอื่น
            if (currentUserRole === "admin" && user.role.toLowerCase() === "admin" && newRole.toLowerCase() !== "admin") {
                res.status(403).json({ message: "Admin ไม่สามารถลด role ของ admin คนอื่นได้" });
                return;
            }

            user.role = newRole;
        }

        // อัปเดตข้อมูลทั่วไป
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (allowedPages) user.allowedPages = allowedPages;

        // อัปโหลดรูปถ้ามี
        if (req.file) {
            cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                async (err, result) => {
                    if (err || !result) return res.status(500).json({ message: "Error uploading image" });
                    user.profile_img = result.secure_url;
                    await user.save();

                    const token = jwt.sign(
                        { userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, profile_img: user.profile_img },
                        process.env.JWT_SECRET!,
                        { expiresIn: "20m" }
                    );

                    res.status(200).json({ message: "User updated successfully", user, token });
                }
            ).end(req.file.buffer);
        } else {
            await user.save();
            const token = jwt.sign(
                { userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, profile_img: user.profile_img },
                process.env.JWT_SECRET!,
                { expiresIn: "20m" }
            );

            res.status(200).json({ message: "User updated successfully", user, token });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update user", error });
    }
};

// ================= UPDATE STATUS =================
export const updateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user?._id;
        const currentUserRole = req.user?.role?.toLowerCase();
        if (!currentUserId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!["admin", "super admin"].includes(currentUserRole || "")) {
            res.status(403).json({ message: "Forbidden: เฉพาะ admin/super admin เปลี่ยนสถานะได้" });
            return;
        }

        const { targetUserId, isActive } = req.body;
        if (!targetUserId || typeof isActive !== "boolean") {
            res.status(400).json({ message: "Missing targetUserId or isActive" });
            return;
        }

        if (String(currentUserId) === String(targetUserId) && !isActive) {
            res.status(400).json({ message: "ไม่สามารถปิดใช้งานตัวเองได้" });
            return;
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({ message: `User status updated to ${isActive ? "Active" : "Inactive"}`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update user status", error });
    }
};

// ================= DELETE USER =================
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user?._id;
        const currentUserRole = req.user?.role?.toLowerCase();
        if (!currentUserId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!["admin", "super admin"].includes(currentUserRole || "")) {
            res.status(403).json({ message: "Forbidden: เฉพาะ admin/super admin ลบผู้ใช้ได้" });
            return;
        }

        if (String(userId) === String(currentUserId)) {
            res.status(400).json({ message: "ไม่สามารถลบตัวเองได้" });
            return;
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete user", error });
    }
};
