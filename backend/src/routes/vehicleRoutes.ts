import express from 'express';
import { getVehiclesWithPositions, getVehicleTimelineEvents, reverseGeocode } from '../controllers/vehicleController';

const router = express.Router();

router.get('/vehicles', getVehiclesWithPositions);
router.get('/vehicle/:vehicle_id/view', getVehicleTimelineEvents);
router.get('/reverse-geocode', reverseGeocode);

export default router;
