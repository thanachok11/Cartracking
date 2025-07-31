import axios from 'axios';
import { Contrainers } from '../../types/Contrainer'; // << เพิ่มบรรทัดนี้ ให้ถูก path


const API_BASE_URL = process.env.REACT_APP_API_URL;

export const fetchAllContrainers = async (): Promise<Contrainers[]> => {
    const response = await axios.get(`${API_BASE_URL}/containers`);
    return response.data;
};

export const fetchContrainerById = async (id: string): Promise<Contrainers> => {
    const response = await axios.get(`${API_BASE_URL}/containers/${id}`);
    return response.data;
};

