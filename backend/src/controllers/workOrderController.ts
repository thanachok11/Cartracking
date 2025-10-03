import { Response } from "express";
import WorkOrder, { IWorkOrder } from "../models/WorkOrder";
import { AuthenticatedRequest } from "../Middleware/authMiddleware"; // type request ที่มี userId, role
import XLSX from "xlsx";
import { excelDateToJSDate } from "../utils/excelHelpers";

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


// =============================
// 2) Confirm Import
// =============================
export const confirmWorkOrders = async (req: any, res: any) => {
    try {
        const rows = req.body?.rows;
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ code: "NO_ROWS", message: "ไม่มีข้อมูลสำหรับบันทึก" });
        }

        // ✅ Map ข้อมูลตาม schema
        const workOrders = rows.map((row: any) => ({
            issueDate: row.issueDate ? excelDateToJSDate(row.issueDate) : null,
            workOrderNumber: row.workOrderNumber?.trim(),
            product: row.product?.trim(),
            driverName: row.driverName?.trim(),
            driverPhone: row.driverPhone?.trim(),
            headPlate: row.headPlate?.trim(),
            tailPlate: row.tailPlate?.trim(),
            containerNumber: row.containerNumber?.trim(),
            companyName: row.companyName?.trim(),
            description: row.description?.trim() || "",
            createdBy: req.userId,
        }));

        // ✅ Validate required fields
        const invalid = workOrders.filter(
            (w) =>
                !w.issueDate ||
                !w.workOrderNumber ||
                !w.product ||
                !w.driverName ||
                !w.driverPhone ||
                !w.headPlate ||
                !w.tailPlate ||
                !w.containerNumber ||
                !w.companyName
        );
        if (invalid.length > 0) {
            return res.status(400).json({
                code: "INVALID_ROWS",
                message: `พบ ${invalid.length} แถวที่ข้อมูลไม่ครบ`,
                invalid,
            });
        }

        // ✅ ตรวจสอบ duplicate workOrderNumber ใน DB
        const numbers = workOrders.map((w) => w.workOrderNumber);
        const existing = await WorkOrder.find({ workOrderNumber: { $in: numbers } }, "workOrderNumber");
        if (existing.length > 0) {
            return res.status(400).json({
                code: "DUPLICATE",
                message: "พบเลขที่ใบสั่งงานซ้ำในระบบ",
                duplicates: existing.map((e) => e.workOrderNumber),
            });
        }

        // ✅ บันทึกลง DB
        await WorkOrder.insertMany(workOrders);

        return res.status(201).json({
            message: "✅ Import สำเร็จ",
            count: workOrders.length,
        });
    } catch (error: any) {
        console.error("❌ Confirm Import Error:", error.message);
        return res.status(500).json({ message: "บันทึกไม่สำเร็จ", error: error.message });
    }
};

export const downloadWorkOrderTemplate = async (req: any, res: any) => {
    try {
        const lang = req.params.lang || "th"; // default ไทย
        let headers: string[] = [];
        let sampleData: any[][] = [];

        if (lang === "en") {
            headers = ["issueDate", "workOrderNumber", "product", "driverName", "driverPhone", "headPlate", "tailPlate", "containerNumber", "companyName", "description"];
            sampleData = [["2025-10-01", "WO-1001", "Cement", "Somchai", "0812345678", "1ABC123", "2XYZ456", "CONT001", "Porchoen", "Deliver to site"]];
        } else if (lang === "zh") {
            headers = ["日期", "订单号", "产品", "司机", "电话", "车头牌照", "车尾牌照", "集装箱号", "公司", "备注"];
            sampleData = [["2025-10-01", "WO-1001", "水泥", "张三", "0812345678", "1ABC123", "2XYZ456", "CONT001", "博辰公司", "运送到工地"]];
        } else {
            headers = ["วันที่ออก", "เลขที่ใบสั่งงาน", "สินค้า", "ชื่อคนขับ", "เบอร์โทร", "ทะเบียนหัว", "ทะเบียนหาง", "เลขตู้", "บริษัท", "รายละเอียด"];
            sampleData = [["2025-10-01", "WO-1001", "ปูนซีเมนต์", "สมชาย ขับรถ", "0812345678", "1กข1234", "2ขค5678", "CONT001", "ป๋อเฉิน", "ส่งไปไซต์"]];
        }

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Disposition", `attachment; filename=workorder_template_${lang}.xlsx`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (err) {
        console.error("❌ Error generating template:", err);
        res.status(500).json({ message: "❌ ไม่สามารถสร้าง template ได้" });
    }
};
