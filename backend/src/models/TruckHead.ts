import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITruckHead extends Document {
    licensePlate: string;      // เลขทะเบียน
    companyName: string;       // ชื่อบริษัท
    createdBy: Types.ObjectId; // ผู้สร้างข้อมูล (อ้างอิง User)
}

const truckHeadSchema = new Schema<ITruckHead>(
    {
        licensePlate: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        companyName: {
            type: String,
            required: true,
            trim: true,
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

const TruckHead = mongoose.model<ITruckHead>('TruckHead', truckHeadSchema);

export default TruckHead;
