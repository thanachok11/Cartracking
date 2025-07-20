import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IContainer extends Document {
    containerNumber: string;   // หมายเลขตู้คอนเทนเนอร์
    companyName: string;       // ชื่อบริษัท
    containerSize: string;     // ขนาดตู้ (เช่น 20ft, 40ft)
    createdBy: Types.ObjectId; // ผู้สร้างข้อมูล (อ้างอิง User)
}

const containerSchema = new Schema<IContainer>(
    {
        containerNumber: {
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
        containerSize: {
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

const Container = mongoose.model<IContainer>('Container', containerSchema);

export default Container;
