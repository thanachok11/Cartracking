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
            username: "", 
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
        // Step 1: Login
        const sessionCookie = await ctLogin();

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
        };

        // Step 2: ดึงรายชื่อรถ
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

        // Step 3: ดึงตำแหน่งรถ
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
