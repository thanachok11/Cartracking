import { Request, Response } from "express";
import DataToday from "../models/DataToday";
import { AuthenticatedRequest } from "../Middleware/authMiddleware";
import mongoSanitize from "express-mongo-sanitize";

//  GET ALL
export const getAllDataToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: missing user info" });
      return;
    }

    // sanitize query params (ถ้ามี filter)
    const cleanQuery = mongoSanitize.sanitize(req.query || {});
    const cq: any = cleanQuery || {};

    // whitelist allowed filters and build mongo filter
    const filter: any = {};
    if (cq.driver_name) filter.driver_name = String(cq.driver_name).trim();
    if (cq.container_no) filter.container_no = String(cq.container_no).trim();
    if (cq.head_registration) filter.head_registration = String(cq.head_registration).trim();

    // handle date range: expect yyyy-mm-dd strings from frontend
    const isYmd = (s: string) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const fromStr = isYmd(cq.from) ? cq.from : null;
    const toStr = isYmd(cq.to) ? cq.to : null;
    if (fromStr || toStr) {
      const from = fromStr || toStr;
      const to = toStr || fromStr || from;
      // parse as UTC-day range (frontend sends yyyy-mm-dd)
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);
      filter.datetime_in = { $gte: fromDate, $lte: toDate };
    }

    const data = await DataToday.find(filter).sort({ datetime_in: -1 });
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

//  GET BY ID
export const getDataTodayById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: missing user info" });
      return;
    }

    const data = await DataToday.findById(req.params.id);
    if (!data) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

// CREATE
export const createDataToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: missing user info" });
      return;
    }

    if (!["admin", "super admin", "manager"].includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: only admin can create containers" });
      return;
    }

    const cleanBody = mongoSanitize.sanitize(req.body);

    const newData = new DataToday({
      ...cleanBody,
      createdBy: req.user._id, // ระบุผู้สร้าง
    });

    const savedData = await newData.save();
    res.status(201).json(savedData);
  } catch (error) {
    res.status(400).json({ message: "Error creating data", error });
  }
};

// UPDATE
export const updateDataToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: missing user info" });
      return;
    }

    if (!["admin", "super admin", "manager"].includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: only admin can update containers" });
      return;
    }

    const cleanBody = mongoSanitize.sanitize(req.body);

    const updatedData = await DataToday.findByIdAndUpdate(
      req.params.id,
      { ...cleanBody, updatedBy: req.user._id }, // ระบุผู้แก้ไข
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    res.status(200).json(updatedData);
  } catch (error) {
    res.status(400).json({ message: "Error updating data", error });
  }
};

// DELETE
export const deleteDataToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: missing user info" });
      return;
    }

    if (!["admin", "super admin", "manager"].includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: only admin can delete containers" });
      return;
    }

    const deletedData = await DataToday.findByIdAndUpdate(
      req.params.id,
      { deletedBy: req.user._id }, // ระบุผู้ลบ
      { new: true }
    );

    if (!deletedData) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    // สามารถลบจริงหรือใช้ soft-delete
    await DataToday.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Data deleted successfully", deletedBy: req.user._id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting data", error });
  }
};
