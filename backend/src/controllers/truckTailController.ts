import { Response } from 'express';
import TruckTail from '../models/TruckTail';
import { ITruckTail } from '../models/TruckTail';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import fs from 'fs';
import path from 'path';

// ✅ Create a new truck tail
export const createTruckTail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { licensePlate } = req.body;

        if (!licensePlate) {
            res.status(400).json({ message: 'Please provide licensePlate' });
            return;
        }

        const truckTailData: Partial<ITruckTail> = {
            licensePlate,
            createdBy: req.user._id,
        };

        const newTruckTail = new TruckTail(truckTailData);
        await newTruckTail.save();

        res.status(201).json({ message: 'Truck tail created successfully', data: newTruckTail });
    } catch (error: any) {
        console.error('Error creating truck tail:', error);
        
        // Handle duplicate license plate error
        if (error.code === 11000) {
            res.status(400).json({ message: 'License plate already exists' });
            return;
        }
        
        res.status(500).json({ message: 'Failed to create truck tail' });
    }
};

// ✅ Get all truck tails
export const getAllTruckTails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // ป้องกัน cache / 304
        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const truckTails = await TruckTail.find();
        
        res.status(200).json({
            success: true,
            data: truckTails
        });
    } catch (error: any) {
        console.error('Error fetching truck tails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch truck tails'
        });
    }
};

// ✅ Get truck tail by ID
export const getTruckTailById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckTail = await TruckTail.findById(id);

        if (!truckTail) {
            res.status(404).json({ message: 'Truck tail not found' });
            return;
        }

        res.status(200).json(truckTail);
    } catch (error) {
        console.error('Error fetching truck tail:', error);
        res.status(500).json({ message: 'Failed to fetch truck tail' });
    }
};

// ✅ Update truck tail
export const updateTruckTail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckTail = await TruckTail.findById(id);

        if (!truckTail) {
            res.status(404).json({ message: 'Truck tail not found' });
            return;
        }

        const updatedTruckTail = await TruckTail.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ message: 'Truck tail updated successfully', data: updatedTruckTail });
    } catch (error: any) {
        console.error('Error updating truck tail:', error);
        
        // Handle duplicate license plate error
        if (error.code === 11000) {
            res.status(400).json({ message: 'License plate already exists' });
            return;
        }
        
        res.status(500).json({ message: 'Failed to update truck tail' });
    }
};

// ✅ Delete truck tail
export const deleteTruckTail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckTail = await TruckTail.findById(id);

        if (!truckTail) {
            res.status(404).json({ message: 'Truck tail not found' });
            return;
        }

        await TruckTail.findByIdAndDelete(id);

        res.status(200).json({ message: 'Truck tail deleted successfully' });
    } catch (error) {
        console.error('Error deleting truck tail:', error);
        res.status(500).json({ message: 'Failed to delete truck tail' });
    }
};

