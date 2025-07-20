import axios from 'axios';
import { Driver } from '../../types/Driver'; // << เพิ่มบรรทัดนี้ ให้ถูก path


const API_BASE_URL = process.env.REACT_APP_API_URL;

export const fetchAllDrivers = async (): Promise<Driver[]> => {
    const response = await axios.get(`${API_BASE_URL}/vehicles/drivers`);
    return response.data;
};

export const fetchDriverById = async (id: string): Promise<Driver> => {
    const response = await axios.get(`${API_BASE_URL}/vehicles/drivers/${id}`);
    return response.data;
};

