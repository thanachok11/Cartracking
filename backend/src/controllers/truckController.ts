import { Request, Response } from 'express';
import TruckHead from '../models/TruckHead';
import { ITruckHead } from '../models/TruckHead';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';

// Create a new TruckHead
export const createTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const truckData: Partial<ITruckHead> = req.body;

        // Validate required fields
        if (!truckData.licensePlate || !truckData.companyName) {
            res.status(400).json({ message: 'Please provide license plate and company name' });
            return;
        }

        // Get createdBy from request (assuming req.userId exists)
        const createdBy = (req as any).userId;
        if (!createdBy) {
            res.status(401).json({ message: 'Unauthorized: missing userId' });
            return;
        }

        const newTruck = new TruckHead({
            ...truckData,
            createdBy,
        });

        await newTruck.save();

        res.status(201).json({ message: 'TruckHead created successfully', data: newTruck });
    } catch (error) {
        console.error('Error creating TruckHead:', error);
        res.status(500).json({ message: 'Failed to create TruckHead' });
    }
};

// Get all TruckHeads
export const getAllTruckHeads = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const trucks = await TruckHead.find();
        res.status(200).json(trucks);
    } catch (error) {
        console.error('Error fetching TruckHeads:', error);
        res.status(500).json({ message: 'Failed to fetch TruckHeads' });
    }
};

// Get TruckHead by ID
export const getTruckHeadById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const truck = await TruckHead.findById(id);

        if (!truck) {
            res.status(404).json({ message: 'TruckHead not found' });
            return;
        }

        res.status(200).json(truck);
    } catch (error) {
        console.error('Error fetching TruckHead:', error);
        res.status(500).json({ message: 'Failed to fetch TruckHead' });
    }
};

// Update TruckHead
export const updateTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedTruck = await TruckHead.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedTruck) {
            res.status(404).json({ message: 'TruckHead not found' });
            return;
        }

        res.status(200).json({ message: 'TruckHead updated successfully', data: updatedTruck });
    } catch (error) {
        console.error('Error updating TruckHead:', error);
        res.status(500).json({ message: 'Failed to update TruckHead' });
    }
};

// Delete TruckHead
export const deleteTruckHead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedTruck = await TruckHead.findByIdAndDelete(id);

        if (!deletedTruck) {
            res.status(404).json({ message: 'TruckHead not found' });
            return;
        }

        res.status(200).json({ message: 'TruckHead deleted successfully' });
    } catch (error) {
        console.error('Error deleting TruckHead:', error);
        res.status(500).json({ message: 'Failed to delete TruckHead' });
    }
};
