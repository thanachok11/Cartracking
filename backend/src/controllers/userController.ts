import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { IUser } from "../models/User";
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import cloudinary from '../config/cloudinary';
import jwt from "jsonwebtoken";

// CREATE USER
export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "อีเมลนี้ มีผู้ใช้อยู่ในระบบแล้ว" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            isActive: false, // เพิ่มตรงนี้
            profile_img:
                "https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg",
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
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to create user", error });
    }
};
// UPDATE USER
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user?._id; // id ของคนที่ login
        const currentUserRole = req.user?.role; // role ของคนที่ login
        if (!currentUserId) {
            res.status(401).json({ message: "Unauthorized: missing user info" })
            return
        };

        const { targetUserId, firstName, lastName, email, newRole } = req.body;

        // ถ้าไม่ส่ง targetUserId มา → แก้ไขตัวเอง
        const idToUpdate = targetUserId || currentUserId;

        const user = await User.findById(idToUpdate);
        if (!user) {
            res.status(404).json({ message: "User not found" })
            return
        };

        // ✅ ตรวจสอบสิทธิ์การเปลี่ยน role
        if (newRole) {
            const roleLower = (currentUserRole || "").toString().toLowerCase();
            const targetRoleLower = newRole.toString().toLowerCase();
            const targetUserRoleLower = (user.role || "").toString().toLowerCase();

            // ให้ super admin และ admin แก้ role ได้
            if (roleLower !== "super admin" && roleLower !== "admin") {
                 res.status(403).json({ message: "Forbidden: เฉพาะ super admin หรือ admin ที่สามารถเปลี่ยน role ได้" });
                return ;
            }

            // กันไม่ให้ลด role ตัวเอง (เฉพาะ admin หรือ super admin)
            if (String(currentUserId) === String(user._id) && roleLower === "admin" && targetRoleLower !== "admin") {
                res.status(400).json({ message: "Admin ไม่สามารถลดระดับ role ของตัวเองได้" });
                return  ;
            }

            // กัน admin ลด role ของ admin คนอื่น
            if (roleLower === "admin" && targetUserRoleLower === "admin" && targetRoleLower !== "admin") {
                 res.status(403).json({ message: "Admin ไม่สามารถลดระดับ role ของ admin คนอื่นได้" });
                return ;
            }

            user.role = newRole;
        }


        // เตรียมข้อมูลอัปเดต
        const updatedData: Partial<IUser> = {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            email: email || user.email,
            role: newRole || user.role,
        };

        // ⬇️ โค้ดส่วน upload รูป / save / token (เดิม) ไม่แก้
        if (req.file) {
            cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                async (err, result) => {
                    if (err || !result) {
                        console.error(err);
                        res.status(500).json({ message: "Error uploading image" });
                        return;
                    }

                    updatedData.profile_img = result.secure_url;

                    Object.assign(user, updatedData);
                    await user.save();

                    const newToken = jwt.sign(
                        {
                            userId: user._id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            profile_img: user.profile_img,
                        },
                        process.env.JWT_SECRET!,
                        { expiresIn: "20m" }
                    );

                    res.status(200).json({
                        message: "User updated successfully",
                        user: {
                            id: user._id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            profile_img: user.profile_img,
                        },
                        token: newToken,
                    });
                }
            ).end(req.file.buffer);
        } else {
            Object.assign(user, updatedData);
            await user.save();

            const newToken = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    profile_img: user.profile_img,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "20m" }
            );

            res.status(200).json({
                message: "User updated successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    profile_img: user.profile_img,
                },
                token: newToken,
            });
        }

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user", error });
    }
};
// UPDATE USER STATUS
export const updateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.user?._id;
        const currentUserRole = req.user?.role; // ดึง role ของผู้ทำ action
        if (!currentUserId) {
            res.status(401).json({ message: "Unauthorized: missing user info" });
            return;
        }

        // เช็คสิทธิ์: เฉพาะ admin และ super admin
        const allowedRoles = ["admin", "super admin"];
        if (!currentUserRole || !allowedRoles.includes(currentUserRole.toLowerCase())) {
            res.status(403).json({ message: "Forbidden: เฉพาะ admin และ super admin เท่านั้นที่สามารถเปลี่ยนสถานะได้" });
            return;
        }

        const { targetUserId, isActive } = req.body;
        if (!targetUserId || typeof isActive !== "boolean") {
            res.status(400).json({ message: "Missing targetUserId or isActive" });
            return;
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // ป้องกันไม่ให้ตัวเองปิดใช้งานตัวเอง
        if (String(currentUserId) === String(user._id) && !isActive) {
            res.status(400).json({ message: "คุณไม่สามารถปิดใช้งานบัญชีของตัวเองได้" });
            return;
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            message: `User status updated to ${isActive ? "Active" : "Inactive"}`,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
                profile_img: user.profile_img,
            },
        });

    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status", error });
    }
};
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.body; // <-- เปลี่ยนจาก targetUserId
    const currentUserId = req.user?._id;
    const currentUserRole = req.user?.role;

    if (!currentUserId) {
        res.status(401).json({ message: "Unauthorized: missing user info" });
        return;
    }

    const allowedRoles = ["admin", "super admin"];
    if (!currentUserRole || !allowedRoles.includes(currentUserRole.toLowerCase())) {
        res.status(403).json({ message: "Forbidden: เฉพาะ admin และ super admin เท่านั้นที่สามารถลบผู้ใช้นี้ได้" });
        return;
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (String(userId) === String(currentUserId)) {
            res.status(400).json({ message: "คุณไม่สามารถลบบัญชีของตัวเองได้" });
            return;
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user", error });
    }
};