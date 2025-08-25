import mongoose, { Schema, Document, model, models } from 'mongoose';

// Define an interface for the User document
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    profile_img: string;
    isActive: boolean;            // ← เพิ่ม isActive
    createdAt: Date;
    updatedAt: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

// Define the schema for the User model
const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        role: {
            type: String,
            enum: ['super admin', 'admin', 'manager', 'viewer', 'user'],
            default: 'user',
        },
        profile_img: {
            type: String,
            default: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg',
        },
        isActive: {
            type: Boolean,
            default: false,  // ← เพิ่ม default false
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User;
