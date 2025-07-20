import { Response } from 'express';
import Driver from '../models/Driver';
import { IDriver } from '../models/Driver';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';

// สร้างข้อมูลคนขับใหม่
export const createDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { firstName, lastName, phoneNumber, position, company, detail, profile_img } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !phoneNumber || !position || !company) {
            res.status(400).json({ message: 'Please provide firstName, lastName, phoneNumber, position and company' });
            return;
        }

        const driverData: Partial<IDriver> = {
            firstName,
            lastName,
            phoneNumber,
            position,
            company,
            detail,         // optional, ใส่ถ้ามี
            profile_img,    // optional, ใส่ถ้ามี
            createdBy: req.user._id,
        };

        const newDriver = new Driver(driverData);
        await newDriver.save();

        res.status(201).json({ message: 'Driver created successfully', data: newDriver });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ message: 'Failed to create driver' });
    }
};
// Get all drivers
export const getAllDrivers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // ถ้าต้องการ filter driver ที่สร้างโดย user นี้ เช่น
        // const drivers = await Driver.find({ createdBy: req.user._id });

        const drivers = await Driver.find();
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'Failed to fetch drivers' });
    }
};


// Get driver by ID
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

// Update driver
export const updateDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedDriver) {
            res.status(404).json({ message: 'Driver not found' });
            return;
        }

        res.status(200).json({ message: 'Driver updated successfully', data: updatedDriver });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'Failed to update driver' });
    }
};

// Delete driver
export const deleteDriver = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedDriver = await Driver.findByIdAndDelete(id);

        if (!deletedDriver) {
            res.status(404).json({ message: 'Driver not found' });
            return;
        }

        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ message: 'Failed to delete driver' });
    }
};
