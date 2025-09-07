import { Request, Response } from "express";
import DataToday from "../models/DataToday";
import cloudinary from '../config/cloudinary';
import { AuthenticatedRequest } from "../Middleware/authMiddleware";
import mongoSanitize from "express-mongo-sanitize";

const allowedRoles = ["admin", "super admin", "manager"];

function checkUser(req: AuthenticatedRequest, res: Response): boolean {
  if (!req.user?._id) {
    res.status(401).json({ message: "Unauthorized: missing user info" });
    return false;
  }
  return true;
}

function checkRole(req: AuthenticatedRequest, res: Response): boolean {
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({ message: "Forbidden: only admin can perform this action" });
    return false;
  }
  return true;
}

async function handleImageUpload(req: AuthenticatedRequest, cleanBody: any, res: Response): Promise<boolean> {
  if (req.file) {
    try {
      const fileBuffer = req.file.buffer;
      await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
          if (err || !result) return reject(err || new Error('upload failed'));
          cleanBody.booking_image = result.secure_url;
          resolve(result);
        }).end(fileBuffer);
      });
    } catch (err) {
      console.error('Error uploading booking image:', err);
      res.status(500).json({ message: 'Failed to upload booking image' });
      return false;
    }
  }
  return true;
}

//  GET ALL
export const getAllDataToday = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!checkUser(req, res)) return;

    const cleanQuery = mongoSanitize.sanitize(req.query || {});
    const filter: any = {};
    if (cleanQuery.driver_name) filter.driver_name = String(cleanQuery.driver_name).trim();
    if (cleanQuery.container_no) filter.container_no = String(cleanQuery.container_no).trim();
    if (cleanQuery.head_registration) filter.head_registration = String(cleanQuery.head_registration).trim();

    const isYmd = (s: string) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
    const fromStr = isYmd(String(cleanQuery.from ?? "")) ? String(cleanQuery.from) : null;
    const toStr = isYmd(String(cleanQuery.to ?? "")) ? String(cleanQuery.to) : null;
    if (fromStr || toStr) {
      const from = fromStr || toStr;
      const to = toStr || fromStr || from;
      filter.datetime_in = {
        $gte: new Date(`${from}T00:00:00.000Z`),
        $lte: new Date(`${to}T23:59:59.999Z`)
      };
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
    if (!checkUser(req, res)) return;

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
    if (!checkUser(req, res) || !checkRole(req, res)) return;

    const cleanBody: any = mongoSanitize.sanitize(req.body);
    const bookingId = cleanBody.booking_id || cleanBody.bookingId || undefined;

    if (!(await handleImageUpload(req, cleanBody, res))) return;

    const newData = new DataToday({
      ...cleanBody,
      booking_id: bookingId,
      booking_image: cleanBody.booking_image,
      createdBy: req.user._id,
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
    if (!checkUser(req, res) || !checkRole(req, res)) return;

    const cleanBody: any = mongoSanitize.sanitize(req.body);
    const bookingId = cleanBody.booking_id || cleanBody.bookingId || undefined;

    if (!(await handleImageUpload(req, cleanBody, res))) return;

    const updatedData = await DataToday.findByIdAndUpdate(
      req.params.id,
      { ...cleanBody, booking_id: bookingId, booking_image: cleanBody.booking_image, updatedBy: req.user._id },
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
    if (!checkUser(req, res) || !checkRole(req, res)) return;

    const deletedData = await DataToday.findByIdAndUpdate(
      req.params.id,
      { deletedBy: req.user._id },
      { new: true }
    );

    if (!deletedData) {
      res.status(404).json({ message: "Data not found" });
      return;
    }

    await DataToday.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Data deleted successfully", deletedBy: req.user._id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting data", error });
  }
};