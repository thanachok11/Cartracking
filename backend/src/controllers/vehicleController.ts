import { Request, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../Middleware/authMiddleware';

// ✅ helper function สำหรับตรวจสอบ user
const requireUser = (req: AuthenticatedRequest, res: Response): string | null => {
    const userId = req.user?._id;
    if (!userId) {
        res.status(401).json({ message: 'Unauthorized: missing user info' });
        return null;
    }
    return userId.toString();
};

// ✅ login function
const ctLogin = async (): Promise<string> => {
    const loginPayload = {
        version: "2.0",
        method: "ct_login",
        id: 10,
        params: {
            x: "x",
            account: "PORC00001",
            username: "", // TODO: ใส่ username ที่ถูกต้อง
            password: "Porchoen.2014",
            locale: "en-ZA",
            otp: "",
            browserName: "",
            version: "3.4.7",
            environment: "live",
            thirdParty: false
        }
    };

    const response = await axios.post(
        'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
        loginPayload,
        { withCredentials: true }
    );

    const setCookieHeader = response.headers['set-cookie'];
    if (!setCookieHeader) throw new Error('ไม่สามารถเข้าสู่ระบบได้');

    return setCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
};

// ✅ ดึงรายชื่อรถ
export const getVehicles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const fleetResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { jsonrpc: "2.0", method: "ct_fleet_get_vehiclelist_v3", params: {}, id: 10 },
            { headers }
        );

        const vehicles = fleetResponse.data?.result?.ct_fleet_get_vehiclelist;
        if (!Array.isArray(vehicles)) {
            res.status(500).json({ error: 'ข้อมูลรถไม่ถูกต้อง' });
            return;
        }

        res.json(vehicles);
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรถ:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรถได้' });
    }
};

// ✅ รายละเอียดรถ
export const getVehicleDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const { vehicleId } = req.params;
        if (!vehicleId) {
            res.status(400).json({ error: 'กรุณาระบุ vehicle_id' });
            return;
        }

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const detailResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { jsonrpc: "2.0", method: "ct_fleet_get_vehicle_details", params: { x: "x", vehicle_id: vehicleId }, id: 10 },
            { headers }
        );

        const detail = detailResponse.data?.result?.ct_fleet_get_vehicle_details;
        if (!detail) {
            res.status(404).json({ error: 'ไม่พบรายละเอียดของรถ' });
            return;
        }

        res.json(detail);
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาดในการดึงรายละเอียดรถ:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงรายละเอียดรถได้' });
    }
};

// ✅ อัปเดตรถ
export const updateVehicleDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const { vehicleId } = req.params;
        const updateData = req.body;

        if (!vehicleId || !updateData) {
            res.status(400).json({ error: 'กรุณาระบุ vehicleId และข้อมูลที่จะอัปเดต' });
            return;
        }

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const updatePayload = {
            jsonrpc: "2.0",
            method: "ct_fleet_update_vehicle_detail_chunk",
            id: 10,
            params: { vehicle_id: vehicleId, data: updateData }
        };

        const response = await axios.post('https://fleetweb-th.cartrack.com/jsonrpc/index.php', updatePayload, { headers });

        if (response.data?.error) {
            console.error('อัปเดตล้มเหลว:', response.data.error);
            res.status(500).json({ error: 'ไม่สามารถอัปเดตรถได้', detail: response.data.error });
            return;
        }

        res.json({ message: 'อัปเดตรถสำเร็จ', result: response.data?.result });
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตรถ:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตรถได้' });
    }
};

// ✅ รถพร้อมตำแหน่ง
export const getVehiclesWithPositions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const fleetResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { jsonrpc: "2.0", method: "ct_fleet_get_vehiclelist_v3", params: {}, id: 10 },
            { headers }
        );

        const vehicles = fleetResponse.data?.result?.ct_fleet_get_vehiclelist;
        if (!Array.isArray(vehicles)) {
            res.status(500).json({ error: 'ข้อมูลรถไม่ถูกต้อง' });
            return;
        }

        const vehicleIds: string[] = vehicles.map((v: any) => v.vehicle_id);

        const positionsResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { version: "2.0", method: "ct_fleet_get_vehicle_positions", id: 10, params: { vehicleIds } },
            { headers }
        );

        if (!positionsResponse.data || positionsResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงตำแหน่งรถได้' });
            return;
        }

        res.json(positionsResponse.data.result.ct_fleet_get_vehicle_positions);
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาด:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
};

// ✅ Timeline events
export const getVehicleTimelineEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const vehicle_id = req.params.vehicle_id;
        const date = req.query.date as string;

        if (!vehicle_id || !date) {
            res.status(400).json({ error: 'กรุณาระบุ vehicle_id และ date' });
            return;
        }

        const start_date = `${date} 00:00:00`;
        const end_date = `${date} 23:59:59`;

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const timelineResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { version: "2.0", method: "ct_fleet_get_timeline_events", id: 10, params: { vehicle_id, start_date, end_date } },
            { headers }
        );

        if (!timelineResponse.data || timelineResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล timeline ได้' });
            return;
        }

        res.json(timelineResponse.data.result);
    } catch (error: any) {
        console.error('Error in getVehicleTimelineEvents:', error.message || error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึง timeline' });
    }
};

// ✅ Reverse geocode
export const reverseGeocode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const lat = req.query.lat as string;
        const lon = req.query.lon as string;

        if (!lat || !lon) {
            res.status(400).json({ error: 'กรุณาระบุ lat และ lon' });
            return;
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Cartracking/1.0 (thanachok.suwan@gmail.com)' },
            timeout: 15000,
        });

        res.json(response.data);
    } catch (error: any) {
        console.error('Error reverse geocode:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถแปลงตำแหน่งเป็นที่อยู่ได้' });
    }
};

// ✅ Geofences
export const getGeofences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const geofenceResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { version: '2.0', method: 'ct_fleet_get_geofence_v2', id: 10, params: {} },
            { headers }
        );

        if (!geofenceResponse.data || geofenceResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Geofence ได้' });
            return;
        }

        const geofences = geofenceResponse.data.result?.ct_fleet_get_geofence;
        if (!geofences) {
            res.status(404).json({ error: 'ไม่พบข้อมูล Geofence' });
            return;
        }

        res.json(geofences);
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาด:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Geofence ได้' });
    }
};

// ✅ Drivers
export const getDrivers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = requireUser(req, res);
        if (!userId) return;

        const sessionCookie = await ctLogin();
        const headers = { 'Content-Type': 'application/json', 'Cookie': sessionCookie };

        const driversResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            { version: '2.0', method: 'ct_fleet_get_drivers_v2', id: 10, params: {} },
            { headers }
        );

        if (!driversResponse.data || driversResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคนขับได้' });
            return;
        }

        const drivers = driversResponse.data.result?.ct_fleet_get_drivers;
        if (!drivers) {
            res.status(404).json({ error: 'ไม่พบข้อมูลคนขับ' });
            return;
        }

        res.json(drivers);
    } catch (error: any) {
        console.error('เกิดข้อผิดพลาด:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคนขับได้' });
    }
};
