import express from 'express';
import { getVehiclesWithPositions } from '../controllers/vehicleController';

const router = express.Router();

router.get('/vehicles', getVehiclesWithPositions);

export default router;
