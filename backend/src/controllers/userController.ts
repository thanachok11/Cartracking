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
        const userId = req.user?._id; // ใช้ userId จาก token
        if (!userId) {
            res.status(401).json({ message: "Unauthorized: missing user info" })
            return
        };

        const { firstName, lastName, email, newRole } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" })
            return
        };

        // ตรวจสอบอีเมลซ้ำ
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: "อีเมลนี้ มีผู้ใช้อยู่ในระบบแล้ว" })
            }
            return
        };

        // เตรียมข้อมูลอัปเดตแบบ Partial<IUser>
        const updatedData: Partial<IUser> = {
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            email: email || user.email,
            role: newRole || user.role,
        };

        // ถ้ามีไฟล์รูป → อัปโหลดก่อน update
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

                    // merge ข้อมูลและ save
                    Object.assign(user, updatedData);
                    await user.save();

                    // สร้าง token ใหม่
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
                        { expiresIn: "30m" }
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
            // ไม่มีไฟล์ → save ธรรมดา
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
                { expiresIn: "30m" }
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

// DELETE USER
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { userId, currentUserId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (userId === currentUserId) {
            res.status(400).json({ message: "Cannot delete your own account" });
            return;
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user", error });
    }
};
