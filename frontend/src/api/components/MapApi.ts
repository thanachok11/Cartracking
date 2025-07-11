// src/api/MapApi.ts
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

export const fetchVehiclePositions = async (): Promise<VehiclePosition[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicles`);
    const positionsArray: VehiclePosition[] = Object.values(response.data);
    return positionsArray;
};
