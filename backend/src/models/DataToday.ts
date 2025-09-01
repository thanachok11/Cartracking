import mongoose, { Document, Schema, Model } from "mongoose";

export interface IDataToday extends Document {
    datetime_in: Date;
    datetime_out: Date;
    driver_name: string;
    head_registration: string;
    tail_registration: string;
    container_no: string;
    station_in: string;
    station_out: string;
    companyname: string;
    createdBy: Schema.Types.ObjectId; // เพิ่ม
    updatedBy?: Schema.Types.ObjectId;
    deletedBy?: Schema.Types.ObjectId;
}

const DataTodaySchema: Schema<IDataToday> = new Schema(
    {
        datetime_in: { type: Date, required: true, index: true },
        driver_name: { type: String, required: true, trim: true },
        head_registration: { type: String, required: true, trim: true, index: true },
        tail_registration: { type: String, required: true, trim: true, index: true },
        container_no: { type: String, required: true, trim: true, index: true },
        station_in: { type: String, required: true, trim: true },
        companyname: { type: String, required: true, trim: true, index: true },

        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: true,
    }
);

const DataToday: Model<IDataToday> =
    mongoose.models.DataToday || mongoose.model<IDataToday>("DataToday", DataTodaySchema);

export default DataToday;
