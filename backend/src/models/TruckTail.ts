import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITruckTail extends Document {
    licensePlate: string;      // เลขทะเบียน
    createdBy: Types.ObjectId; // ผู้สร้างข้อมูล (อ้างอิง User)
}

const truckTailSchema = new Schema<ITruckTail>(
    {
        licensePlate: {
            type: String,
            required: true,
            unique: true,
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

const TruckTail = mongoose.model<ITruckTail>('TruckTail', truckTailSchema);

export default TruckTail;
