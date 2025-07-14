import axios from "axios";

export interface VehiclePosition {
    vehicle_id: string;
    latitude: string;
    longitude: string;
    registration: string;
    speed: number;
    ignition: string;
    event_description: string;
    running_status: string;
}

export interface Driver {
    [x: string]: string;
    driver_id: string;
    driver_name: string;
    driver_license: string;
    phone: string;
    // เพิ่ม field ตามจริงที่ backend ส่งมาได้เลย
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
