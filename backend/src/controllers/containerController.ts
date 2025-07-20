import { Response } from 'express';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import Container from '../models/Container';
import { IContainer } from '../models/Container';

// Create a new container
export const createContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Check authenticated user exists
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        // Destructure fields from req.body
        const { containerNumber, companyName, containerSize } = req.body;

        // Validate required fields
        if (!containerNumber || !companyName || !containerSize) {
            res.status(400).json({ message: 'Please provide containerNumber, companyName and containerSize' });
            return;
        }

        // Build container data explicitly
        const containerData: Partial<IContainer> = {
            containerNumber,
            companyName,
            containerSize,
            createdBy: req.user._id,
        };

        const newContainer = new Container(containerData);
        await newContainer.save();

        res.status(201).json({ message: 'Container created successfully', data: newContainer });
    } catch (error) {
        console.error('Error creating container:', error);
        res.status(500).json({ message: 'Failed to create container' });
    }
};

// Get all containers created by this user
export const getAllContainers = async (res: Response): Promise<void> => {
    try {
        const containers = await Container.find();
        res.status(200).json(containers);
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ message: 'Failed to fetch containers' });
    }
};

// Get container by ID
export const getContainerById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const container = await Container.findById(id);

        if (!container) {
            res.status(404).json({ message: 'Container not found' });
            return;
        }

        res.status(200).json(container);
    } catch (error) {
        console.error('Error fetching container:', error);
        res.status(500).json({ message: 'Failed to fetch container' });
    }
};

// Update container
export const updateContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedContainer = await Container.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedContainer) {
            res.status(404).json({ message: 'Container not found' });
            return;
        }

        res.status(200).json({ message: 'Container updated successfully', data: updatedContainer });
    } catch (error) {
        console.error('Error updating container:', error);
        res.status(500).json({ message: 'Failed to update container' });
    }
};

// Delete container
export const deleteContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedContainer = await Container.findByIdAndDelete(id);

        if (!deletedContainer) {
            res.status(404).json({ message: 'Container not found' });
            return;
        }

        res.status(200).json({ message: 'Container deleted successfully' });
    } catch (error) {
        console.error('Error deleting container:', error);
        res.status(500).json({ message: 'Failed to delete container' });
    }
};
