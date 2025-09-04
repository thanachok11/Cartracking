import { Response } from 'express';
import TruckHead from '../models/TruckHead';
import { ITruckHead } from '../models/TruckHead';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import fs from 'fs';
import path from 'path';

// ✅ Create a new truck head
export const createTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { licensePlate, companyName } = req.body;

        if (!licensePlate || !companyName) {
            res.status(400).json({ message: 'Please provide licensePlate and companyName' });
            return;
        }

        const truckHeadData: Partial<ITruckHead> = {
            licensePlate,
            companyName,
            createdBy: req.user._id,
        };

        const newTruckHead = new TruckHead(truckHeadData);
        await newTruckHead.save();

        res.status(201).json({ message: 'Truck head created successfully', data: newTruckHead });
    } catch (error: any) {
        console.error('Error creating truck head:', error);
        
        // Handle duplicate license plate error
        if (error.code === 11000) {
            res.status(400).json({ message: 'License plate already exists' });
            return;
        }
        
        res.status(500).json({ message: 'Failed to create truck head' });
    }
};

// ✅ Get all truck heads
export const getAllTruckHeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // ป้องกัน cache / 304
        res.set('Cache-Control', 'no-store');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const truckHeads = await TruckHead.find();
        
        res.status(200).json({
            success: true,
            data: truckHeads
        });
    } catch (error: any) {
        console.error('Error fetching truck heads:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch truck heads'
        });
    }
};

// ✅ Get truck head by ID
export const getTruckHeadById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckHead = await TruckHead.findById(id);

        if (!truckHead) {
            res.status(404).json({ message: 'Truck head not found' });
            return;
        }

        res.status(200).json(truckHead);
    } catch (error) {
        console.error('Error fetching truck head:', error);
        res.status(500).json({ message: 'Failed to fetch truck head' });
    }
};

// ✅ Update truck head
export const updateTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckHead = await TruckHead.findById(id);

        if (!truckHead) {
            res.status(404).json({ message: 'Truck head not found' });
            return;
        }

        const updatedTruckHead = await TruckHead.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ message: 'Truck head updated successfully', data: updatedTruckHead });
    } catch (error: any) {
        console.error('Error updating truck head:', error);
        
        // Handle duplicate license plate error
        if (error.code === 11000) {
            res.status(400).json({ message: 'License plate already exists' });
            return;
        }
        
        res.status(500).json({ message: 'Failed to update truck head' });
    }
};

// ✅ Delete truck head
export const deleteTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truckHead = await TruckHead.findById(id);

        if (!truckHead) {
            res.status(404).json({ message: 'Truck head not found' });
            return;
        }

        await TruckHead.findByIdAndDelete(id);

        res.status(200).json({ message: 'Truck head deleted successfully' });
    } catch (error) {
        console.error('Error deleting truck head:', error);
        res.status(500).json({ message: 'Failed to delete truck head' });
    }
};