import { Response } from "express";
import WorkOrder, { IWorkOrder } from "../models/WorkOrder";
import { AuthenticatedRequest } from "../Middleware/authMiddleware"; // type request ที่มี userId, role

// Create WorkOrder (เฉพาะ role >= manager)
export const createWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const workData: Partial<IWorkOrder> = req.body;

        // Check permission
        if (!req.userRole || !["user","manager", "admin", "super admin"].includes(req.userRole)) {
            res.status(403).json({ message: "Forbidden: insufficient permissions" });
            return;
        }

        // Validate required fields
        if (!workData.issueDate || !workData.workOrderNumber) {
            res.status(400).json({ message: "Please provide issue date and work order number" });
            return;
        }

        const createdBy = req.userId;
        if (!createdBy) {
            res.status(401).json({ message: "Unauthorized: missing userId" });
            return;
        }

        const newWorkOrder = new WorkOrder({
            ...workData,
            createdBy,
        });

        await newWorkOrder.save();
        res.status(201).json({ message: "WorkOrder created successfully", data: newWorkOrder });
    } catch (error) {
        console.error("Error creating WorkOrder:", error);
        res.status(500).json({ message: "Failed to create WorkOrder" });
    }
};

// Get all WorkOrders with optional search by workOrderNumber (ทุกคนที่ login เข้ามาได้)
export const getAllWorkOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { search, workOrderNumber } = req.query;
        
        // Build query filter
        let filter: any = {};
        
        if (workOrderNumber) {
            // Exact match for workOrderNumber
            filter.workOrderNumber = workOrderNumber;
        } else if (search) {
            // Partial match search in workOrderNumber
            filter.workOrderNumber = { $regex: search, $options: 'i' };
        }
        
        const workOrders = await WorkOrder.find(filter).sort({ issueDate: -1 });
        res.status(200).json(workOrders);
    } catch (error) {
        console.error("Error fetching WorkOrders:", error);
        res.status(500).json({ message: "Failed to fetch WorkOrders" });
    }
};

// Get WorkOrder by workOrderNumber
export const getWorkOrderByNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { workOrderNumber } = req.params;
        const workOrder = await WorkOrder.findOne({ workOrderNumber });

        if (!workOrder) {
            res.status(404).json({ message: "WorkOrder not found" });
            return;
        }

        res.status(200).json(workOrder);
    } catch (error) {
        console.error("Error fetching WorkOrder by number:", error);
        res.status(500).json({ message: "Failed to fetch WorkOrder" });
    }
};

// Get WorkOrder by ID
export const getWorkOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workOrder = await WorkOrder.findById(id);

        if (!workOrder) {
            res.status(404).json({ message: "WorkOrder not found" });
            return;
        }

        res.status(200).json(workOrder);
    } catch (error) {
        console.error("Error fetching WorkOrder:", error);
        res.status(500).json({ message: "Failed to fetch WorkOrder" });
    }
};

// Update WorkOrder (เฉพาะ manager+, หรือ creator ของ workOrder นั้น)
export const updateWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workOrder = await WorkOrder.findById(id);

        if (!workOrder) {
            res.status(404).json({ message: "WorkOrder not found" });
            return;
        }

        // Check permission
        if (
            req.userRole !== "super admin" &&
            req.userRole !== "admin" &&
            req.userRole !== "manager" &&
            workOrder.createdBy?.toString() !== req.userId
        ) {
            res.status(403).json({ message: "Forbidden: insufficient permissions" });
            return;
        }

        const updateData = {
            ...req.body,
            updatedBy: req.userId, // log ผู้แก้ไข
        };

        const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ message: "WorkOrder updated successfully", data: updatedWorkOrder });
    } catch (error) {
        console.error("Error updating WorkOrder:", error);
        res.status(500).json({ message: "Failed to update WorkOrder" });
    }
};


// Delete WorkOrder (เฉพาะ admin+)
export const deleteWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const workOrder = await WorkOrder.findById(id);

        if (!workOrder) {
            res.status(404).json({ message: "WorkOrder not found" });
            return;
        }

        // Check permission
        if (!req.userRole || !["admin", "super admin"].includes(req.userRole)) {
            res.status(403).json({ message: "Forbidden: insufficient permissions" });
            return;
        }

        await WorkOrder.findByIdAndDelete(id);

        res.status(200).json({ message: `WorkOrder deleted successfully by user ${req.userId}` });
    } catch (error) {
        console.error("Error deleting WorkOrder:", error);
        res.status(500).json({ message: "Failed to delete WorkOrder" });
    }
};
