import { Schema, model, Document, Types } from "mongoose";

export interface IWorkOrder extends Document {
    issueDate: Date;               // วันที่ออกใบสั่ง
    workOrderNumber: string;       // เลขที่ใบสั่งงาน
    product: string;               // สินค้า
    driverName: string;            // พนักงานขับ
    driverPhone: string;           // เบอร์โทรพนักงานขับ
    headPlate: string;             // ทะเบียนหัว
    tailPlate: string;             // ทะเบียนหาง
    containerNumber: string;       // หมายเลขตู้
    companyName: string;           // บริษัท
    description?: string;          // รายละเอียด
    createdBy: Types.ObjectId;     // ✅ ผู้สร้างใบสั่งงาน
    updatedBy?: Types.ObjectId;    // ✅ ผู้แก้ไขใบสั่งงานล่าสุด
    createdAt: Date;
    updatedAt: Date;
}

const WorkOrderSchema = new Schema<IWorkOrder>(
    {
        issueDate: { type: Date, required: true },
        workOrderNumber: { type: String, required: true, unique: true, trim: true },
        product: { type: String, required: true },
        driverName: { type: String, required: true },
        driverPhone: { type: String, required: true },
        headPlate: { type: String, required: true },
        tailPlate: { type: String, required: true },
        containerNumber: { type: String, required: true },
        companyName: { type: String, required: true },
        description: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // ✅ เพิ่มฟิลด์นี้
    },
    {
        timestamps: true, // ✅ Mongoose จะสร้าง createdAt, updatedAt ให้อัตโนมัติ
    }
);

export default model<IWorkOrder>("WorkOrder", WorkOrderSchema);
