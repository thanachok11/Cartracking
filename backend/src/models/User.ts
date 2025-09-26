import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    profile_img: string;
    isActive: boolean;
    allowedPages: string[];
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;        // 👈 เวลา active ล่าสุด
    isOnline: boolean;       // 👈 แสดงสถานะออนไลน์/ออฟไลน์
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        role: { type: String, enum: ['super admin', 'admin', 'manager', 'viewer', 'user'], default: 'user' },
        profile_img: {
            type: String,
            default: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg'
        },
        isActive: { type: Boolean, default: false },
        allowedPages: {
            type: [String],
            default: ['map', 'dashboard', 'vehicles', 'vehiclestail'],
        },

        lastActive: { type: Date, default: Date.now },
        isOnline: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);
export default User;
