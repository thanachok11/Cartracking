import express from 'express';
import { getVehiclesWithPositions, 
    getVehicleTimelineEvents, 
    reverseGeocode, getDrivers, getGeofences,getVehicles
} from '../controllers/vehicleController';

const router = express.Router();

router.get('/vehicles', getVehiclesWithPositions);
router.get('/car', getVehicles);

router.get('/vehicle/:vehicle_id/view', getVehicleTimelineEvents);
router.get('/reverse-geocode', reverseGeocode);
router.get('/drivers', getDrivers);
router.get('/geofences', getGeofences);

export default router;
