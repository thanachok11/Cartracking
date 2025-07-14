import axios from "axios";

export interface VehiclePosition {
    vehicle_id: string;
    latitude: string;
    longitude: string;
    registration: string;
    speed: number;
    ignition: string;
    statusClassName: string;
    running_status: string;

    driver_name?: {
        name: string | null;
        client_driver_id: string | null;
    };
}


export interface Driver {
    out_driver_id: string;
    out_driver_name: string;
    out_driver_surname: string;
    out_vehicle_registration: string | null;
    // เพิ่ม field อื่นถ้าต้องใช้
}


export interface Geofence {
    geofence_id: string;
    geofence_name: string;
    lat: string;
    lon: string;
    geosize: string;
    the_geom: string;
    // เพิ่ม field ตามจริงที่ backend ส่งมาได้เลย
}

export const fetchVehicle = async (): Promise<VehiclePosition[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/car`);
    const positionsArray: VehiclePosition[] = Object.values(response.data);
    return positionsArray;
};


export const fetchVehiclePositions = async (): Promise<VehiclePosition[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicles`);
    const positionsArray: VehiclePosition[] = Object.values(response.data);
    return positionsArray;
};


export const fetchDrivers = async (): Promise<Driver[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/drivers`);
    const driversArray: Driver[] = response.data;
    return driversArray;
};

export const fetchGeofences = async (): Promise<Geofence[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/geofences`);
    const geofencesArray: Geofence[] = response.data;
    return geofencesArray;
};
