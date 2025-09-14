import express from 'express';
import { getVehiclesWithPositions, 
    getVehicleTimelineEvents, 
    reverseGeocode, getDrivers, getGeofences, getVehicles, getVehicleDetail,
    updateVehicleDetail
} from '../controllers/vehicleController';
import { verifyToken } from '../Middleware/authMiddleware';

const router = express.Router();

router.get('/vehicles', verifyToken, getVehiclesWithPositions);
router.get('/car', verifyToken,getVehicles);
router.get('/vehicles/:vehicleId', verifyToken, getVehicleDetail);
router.put('/vehicles/:vehicleId', verifyToken, updateVehicleDetail);
router.patch('/vehicles/:vehicleId', verifyToken,updateVehicleDetail);

router.get('/vehicle/:vehicle_id/view', verifyToken, getVehicleTimelineEvents);
router.get('/reverse-geocode', verifyToken,reverseGeocode);
router.get('/drivers', verifyToken,getDrivers);
router.get('/geofences', verifyToken,getGeofences);

export default router;
