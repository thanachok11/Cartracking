import mongoose, { Document, Schema } from 'mongoose';

// กำหนด Interface สำหรับ Driver
export interface IDriver extends Document {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    position: string;
    company: string;
    detail: string;
    profile_img?: string;
}

// สร้าง Schema สำหรับ Driver
const driverSchema = new Schema<IDriver>(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        position: {
            type: String,
            required: true,
        },
        company: {
            type: String,
            required: true,
        },
        detail: {
            type: String,
            required: true,
        },
        profile_img: {
            type: String,
            default:
                'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg',
        },
    },
    {
        timestamps: true,
    }
);

// สร้าง Model
const Driver = mongoose.model<IDriver>('Driver', driverSchema);

export default Driver;
