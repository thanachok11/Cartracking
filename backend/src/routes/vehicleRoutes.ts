import express from 'express';
import { getVehiclesWithPositions, 
    getVehicleTimelineEvents, 
    reverseGeocode, getDrivers, getGeofences, getVehicles, getVehicleDetail,
    updateVehicleDetail
} from '../controllers/vehicleController';
import { verifyToken } from '../Middleware/authMiddleware';
import { requirePagePermission } from '../Middleware/pagePermissions';
import { PAGE_PERMISSIONS } from '../types/permissions';

const router = express.Router();

// APIs สำหรับ Map (ผู้ใช้ทั่วไปเข้าถึงได้)
router.get('/vehicles', verifyToken, getVehiclesWithPositions);
router.get('/car', verifyToken, getVehicles);
router.get('/reverse-geocode', reverseGeocode);
router.get('/geofences', verifyToken, getGeofences);

// APIs สำหรับ Vehicle Management (ต้องมีสิทธิ์ VEHICLES)
router.get('/vehicles/:vehicleId', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), getVehicleDetail);
router.put('/vehicles/:vehicleId', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), updateVehicleDetail);
router.patch('/vehicles/:vehicleId', verifyToken, requirePagePermission(PAGE_PERMISSIONS.VEHICLES), updateVehicleDetail);

// APIs ที่ต้องการสิทธิ์หลายแบบ
router.get('/vehicle/:vehicle_id/view', verifyToken, requirePagePermission([PAGE_PERMISSIONS.MAP, PAGE_PERMISSIONS.VEHICLES]), getVehicleTimelineEvents);
router.get('/drivers', verifyToken, requirePagePermission(PAGE_PERMISSIONS.DRIVERS), getDrivers);

export default router;
