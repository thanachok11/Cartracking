import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';
import Container from '../models/Container';
import { IContainer } from '../models/Container';
import axios from 'axios';
import qs from 'qs';
interface TokenRequestBody {
    token: string;
}
export const getContainers = async (
    req: Request<{}, {}, TokenRequestBody>,
    res: Response
): Promise<void> => {
    try {
        const { token } = req.body;
        console.log("token",token);

        if (!token) {
            res.status(400).json({ success: false, message: 'Token is required' });
            return;
        }

        const formData = qs.stringify({
            token: token,
            api_name: 'get_containers'
        });

        const response = await axios.post('https://ucontainers.com.cn/api/track_api.php', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ✅ Create a new container
export const createContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?._id) {
            res.status(401).json({ message: 'Unauthorized: missing user info' });
            return;
        }

        const { containerNumber, companyName, containerSize } = req.body;

        if (!containerNumber || !companyName || !containerSize) {
            res.status(400).json({ message: 'Please provide containerNumber, companyName and containerSize' });
            return;
        }

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

// ✅ Get all containers created by this user
export const getAllContainers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        const containers = await Container.find({ createdBy: req.user._id });
        res.status(200).json(containers);
    } catch (error) {
        console.error('Error fetching containers:', error);
        res.status(500).json({ message: 'Failed to fetch containers' });
    }
};

// ✅ Get container by ID (ไม่ต้องเช็ค role)
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

// ✅ Update container (เฉพาะ admin เท่านั้น)
export const updateContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        if (req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden: only admin can update containers' });
            return;
        }

        const { id } = req.params;
        const container = await Container.findById(id);

        if (!container) {
            res.status(404).json({ message: 'Container not found' });
            return;
        }

        const updatedContainer = await Container.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ message: 'Container updated successfully', data: updatedContainer });
    } catch (error) {
        console.error('Error updating container:', error);
        res.status(500).json({ message: 'Failed to update container' });
    }
};

// ✅ Delete container (เฉพาะ admin เท่านั้น)
export const deleteContainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {

        if (req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden: only admin can delete containers' });
            return;
        }

        const { id } = req.params;
        const container = await Container.findById(id);

        if (!container) {
            res.status(404).json({ message: 'Container not found' });
            return;
        }

        await Container.findByIdAndDelete(id);

        res.status(200).json({ message: 'Container deleted successfully' });
    } catch (error) {
        console.error('Error deleting container:', error);
        res.status(500).json({ message: 'Failed to delete container' });
    }
};
