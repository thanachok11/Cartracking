import { Request, Response } from 'express';
import axios from 'axios';

// 1. ฟังก์ชัน login เพื่อรับ session cookie
const ctLogin = async (): Promise<string> => {
    const loginPayload = {
        version: "2.0",
        method: "ct_login",
        id: 10,
        params: {
            x: "x",
            account: "PORC00001",
            username: "", // ใส่ username ให้ครบ
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

    const sessionCookie = setCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
    return sessionCookie;
};

// 2. ฟังก์ชันหลัก: login → ดึงรถ → ดึงตำแหน่ง
export const getVehiclesWithPositions = async (req: Request, res: Response): Promise<void> => {
    try {
        // ✅ Step 1: Login
        const sessionCookie = await ctLogin();

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        };

        // ✅ Step 2: ดึงรายชื่อรถ
        const fleetResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            {
                jsonrpc: "2.0",
                method: "ct_fleet_get_vehiclelist_v3",
                params: {},
                id: 10
            },
            { headers }
        );

        const vehicles = fleetResponse.data?.result?.ct_fleet_get_vehiclelist;

        if (!Array.isArray(vehicles)) {
            res.status(500).json({ error: 'ข้อมูลรถไม่ถูกต้อง' });
            return;
        }

        const vehicleIds: string[] = vehicles.map((v: any) => v.vehicle_id);

        // ✅ Step 3: ดึงตำแหน่งรถ
        const positionsResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            {
                version: "2.0",
                method: "ct_fleet_get_vehicle_positions",
                id: 10,
                params: { vehicleIds }
            },
            { headers }
        );

        if (!positionsResponse.data || positionsResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงตำแหน่งรถได้' });
            return;
        }

        const positions = positionsResponse.data.result.ct_fleet_get_vehicle_positions;
        res.json(positions);

    } catch (error: any) {
        console.error('เกิดข้อผิดพลาด:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
};

export const getVehicleTimelineEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const vehicle_id = req.params.vehicle_id;    // รับจาก route param
        const date = req.query.date as string;       // รับจาก query param

        console.log('📥 Params & Query:', { vehicle_id, date });

        if (!vehicle_id || !date) {
            console.warn('⚠️ Missing required parameters');
            res.status(400).json({ error: 'กรุณาระบุ vehicle_id และ date' });
            return;
        }

        // สร้าง start_date และ end_date ตาม format ที่ API ต้องการ
        const start_date = `${date} 00:00:00`;
        const end_date = `${date} 23:59:59`;

        const sessionCookie = await ctLogin();
        console.log('🔑 ได้ session cookie:', sessionCookie);

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        };

        const requestPayload = {
            version: "2.0",
            method: "ct_fleet_get_timeline_events",
            id: 10,
            params: {
                vehicle_id,
                start_date,
                end_date
            }
        };

        console.log('📤 ส่ง payload:', requestPayload);

        const timelineResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            requestPayload,
            { headers }
        );

        console.log('📦 Timeline response:', timelineResponse.data);

        if (!timelineResponse.data || timelineResponse.data.error) {
            console.error('❌ Timeline API error:', timelineResponse.data?.error);
            res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล timeline ได้' });
            return;
        }

        res.json(timelineResponse.data.result);

    } catch (error: any) {
        console.error('🔥 Error in getVehicleTimelineEvents:', error.message || error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึง timeline' });
    }
};
export const reverseGeocode = async (req: Request, res: Response): Promise<void> => {
    try {
        const lat = req.query.lat as string;
        const lon = req.query.lon as string;

        console.log('🔎 reverse geocode request:', { lat, lon });

        if (!lat || !lon) {
            res.status(400).json({ error: 'กรุณาระบุ lat และ lon' });
            return;
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Cartracking/1.0 (thanachok.suwan@gmail.com)',
            },
            timeout: 15000,
        });

        console.log('✅ reverse geocode response:', response.data);
        res.json(response.data);
    } catch (error: any) {
        console.error('❌ Error reverse geocode:', error.message || error);
        res.status(500).json({ error: 'ไม่สามารถแปลงตำแหน่งเป็นที่อยู่ได้' });
    }
};

export const getGeofences = async (req: Request, res: Response): Promise<void> => {
    try {
        // ✅ Step 1: Login เพื่อเอา session cookie
        const sessionCookie = await ctLogin();

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        };

        // ✅ Step 2: Call API ct_fleet_get_geofence_v2
        const geofenceResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            {
                version: '2.0',
                method: 'ct_fleet_get_geofence_v2',
                id: 10,
                params: {}
            },
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

export const getDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
        // ✅ Step 1: Login เพื่อเอา session cookie
        const sessionCookie = await ctLogin();

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        };

        // ✅ Step 2: Call API เพื่อดึง driver list
        const driversResponse = await axios.post(
            'https://fleetweb-th.cartrack.com/jsonrpc/index.php',
            {
                version: '2.0',
                method: 'ct_fleet_get_drivers_v2',
                id: 10,
                params: {}
            },
            { headers }
        );

        if (!driversResponse.data || driversResponse.data.error) {
            res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคนขับได้' });
            return;
        }

        // ผลลัพธ์อยู่ใน driversResponse.data.result.ct_fleet_get_drivers_v2
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
