import express from "express";
import {
    createDataToday,
    updateDataToday,
    deleteDataToday,
    getAllDataToday,
    getDataTodayById,
} from "../controllers/datatodayController";
import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

//  CREATE (POST)
router.post("/create",  verifyToken , createDataToday);
//  READ ALL
router.get("/", verifyToken, getAllDataToday);

//  READ BY ID
router.get("/:id", verifyToken, getDataTodayById);

//  UPDATE (PATCH)
router.patch("/update/:id",  verifyToken , updateDataToday);

//  DELETE (DELETE)
router.delete("/delete/:id",  verifyToken , deleteDataToday);

export default router;
