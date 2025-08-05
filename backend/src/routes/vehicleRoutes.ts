import express from 'express';
import { getVehiclesWithPositions, 
    getVehicleTimelineEvents, 
    reverseGeocode, getDrivers, getGeofences, getVehicles, getVehicleDetail,
    updateVehicleDetail
} from '../controllers/vehicleController';

const router = express.Router();

router.get('/vehicles/position', getVehiclesWithPositions);
router.get('/vehicles', getVehicles);
router.get('/vehicles/:vehicleId', getVehicleDetail);
router.put('/vehicles/:vehicleId', updateVehicleDetail);
router.patch('/vehicles/:vehicleId', updateVehicleDetail);

router.get('/vehicle/:vehicle_id/view', getVehicleTimelineEvents);
router.get('/reverse-geocode', reverseGeocode);
router.get('/vehicles/drivers', getDrivers);
router.get('/geofences', getGeofences);

export default router;
