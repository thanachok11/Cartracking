import mongoose, { Schema, Document, model, models } from 'mongoose';

// Define an interface for the User document
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string; // เพิ่มฟิลด์ role
    profile_img: string; // เพิ่มฟิลด์ profile_img
    createdAt: Date;
    updatedAt: Date;
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
            enum: ['user', 'admin'], // กำหนดค่าให้เลือกได้ระหว่าง 'user' และ 'admin'
            default: 'admin', // กำหนดค่าเริ่มต้นเป็น 'user'
        },
        profile_img: {
            type: String,
            default: 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg', // กำหนดค่าเริ่มต้นของ profile_img
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Check if the model already exists, if so, use it; otherwise, create a new one
const User = models.User || model<IUser>('User', UserSchema);

export default User;