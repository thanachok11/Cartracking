import express from 'express';
import { getVehiclesWithPositions, 
    getVehicleTimelineEvents, 
    reverseGeocode, getDrivers, getGeofences, getVehicles, getVehicleDetail,
    updateVehicleDetail
} from '../controllers/vehicleController';

const router = express.Router();

router.get('/vehicles', getVehiclesWithPositions);
router.get('/car', getVehicles);
router.get('/vehicles/:vehicleId', getVehicleDetail);
router.put('/vehicles/:vehicleId', updateVehicleDetail);
router.patch('/vehicles/:vehicleId', updateVehicleDetail);

router.get('/vehicle/:vehicle_id/view', getVehicleTimelineEvents);
router.get('/reverse-geocode', reverseGeocode);
router.get('/drivers', getDrivers);
router.get('/geofences', getGeofences);

export default router;
