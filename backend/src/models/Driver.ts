import mongoose, { Document, Schema, Types } from 'mongoose';

// กำหนด Interface สำหรับ Driver
export interface IDriver extends Document {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    position: string;
    company: string;
    detail?: string;  // เปลี่ยนให้ optional ใน interface ด้วย
    profile_img?: string;
    createdBy?: Types.ObjectId;
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
            required: false,  // <-- แก้ตรงนี้
        },
        profile_img: {
            type: String,
            default:
                'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Driver = mongoose.model<IDriver>('Drivers', driverSchema);

export default Driver;
