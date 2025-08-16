import { Response } from 'express';
import Driver from '../models/Driver';
import { IDriver } from '../models/Driver';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import cloudinary from '../config/cloudinary';


export const createDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { firstName, lastName, phoneNumber, position, profile_img,company, detail } = req.body;

        if (!firstName || !lastName || !phoneNumber || !position || !company) {
            res.status(400).json({ message: 'Please provide firstName, lastName, phoneNumber, position and company' });
            return;
        }
        // เตรียมข้อมูล driver
        const driverData: Partial<IDriver> = {
            firstName,
            lastName,
            phoneNumber,
            position,
            company,
            profile_img,
            detail,
            createdBy: userId,
        };

        // ✅ หากมีไฟล์รูปภาพ อัปโหลดไป Cloudinary แล้วเพิ่มลง driverData
        if (req.file) {
            cloudinary.uploader.upload_stream(
                { resource_type: 'auto' },
                async (err, result) => {
                    if (err || !result) {
                        console.error(err);
                        res.status(500).json({ message: 'Error uploading image' });
                        return;
                    }

                    // ✅ อัปเดต URL รูปจริงจาก Cloudinary
                    driverData.profile_img = result.secure_url;

                    const newDriver = new Driver(driverData);
                    await newDriver.save();

                    res.status(201).json({ message: 'Driver created successfully', data: newDriver });
                }
            ).end(req.file.buffer);
        }
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ message: 'Failed to create driver' });
    }
};


// ✅ Get all drivers
export const getAllDrivers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const drivers = await Driver.find();
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'Failed to fetch drivers' });
    }
};

// ✅ Get driver by ID
export const getDriverById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {


        const { id } = req.params;
        const driver = await Driver.findById(id);

        if (!driver) {
            res.status(404).json({ message: 'Driver not found' });
            return;
        }

        res.status(200).json(driver);
    } catch (error) {
        console.error('Error fetching driver:', error);
        res.status(500).json({ message: 'Failed to fetch driver' });
    }
};
// ✅ Update driver with optional profile image upload (เหมือน createDriver)
export const updateDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { id } = req.params;
        const { firstName, lastName, phoneNumber, position, company, detail } = req.body;

        const existingDriver = await Driver.findById(id);
        if (!existingDriver) {
            res.status(404).json({ message: 'Driver not found' });
            return;
        }

        // เตรียมข้อมูลอัปเดต
        const driverData: Partial<IDriver> = {
            firstName: firstName || existingDriver.firstName,
            lastName: lastName || existingDriver.lastName,
            phoneNumber: phoneNumber || existingDriver.phoneNumber,
            position: position || existingDriver.position,
            company: company || existingDriver.company,
            detail: detail || existingDriver.detail,
        };

        // ✅ หากมีไฟล์รูปภาพ → อัปโหลดไป Cloudinary ก่อนแล้ว update
        if (req.file) {
            cloudinary.uploader.upload_stream(
                { resource_type: 'auto' },
                async (err, result) => {
                    if (err || !result) {
                        console.error(err);
                        res.status(500).json({ message: 'Error uploading image' });
                        return;
                    }

                    // ✅ ใส่ URL จาก Cloudinary
                    driverData.profile_img = result.secure_url;

                    // update ข้อมูลรวมทั้งรูป
                    Object.assign(existingDriver, driverData);
                    const updatedDriver = await existingDriver.save();

                    res.status(200).json({ message: 'Driver updated successfully', data: updatedDriver });
                }
            ).end(req.file.buffer);
        } else {
            // ไม่มีไฟล์ → ใช้ค่าเดิม
            Object.assign(existingDriver, driverData);
            const updatedDriver = await existingDriver.save();

            res.status(200).json({ message: 'Driver updated successfully', data: updatedDriver });
        }
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'Failed to update driver' });
    }
};

// ✅ Delete driver
export const deleteDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const existingDriver = await Driver.findById(id);

        if (!existingDriver) {
            res.status(404).json({ message: 'Driver not found' });
            return;
        }

        // ✅ คำสั่งลบจริง
        await Driver.findByIdAndDelete(id);

        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ message: 'Failed to delete driver' });
    }
};

