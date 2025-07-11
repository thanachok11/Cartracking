// src/api/contactApi.ts
import axios from "axios";

export interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

export const sendContactMessage = async (data: ContactFormData) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact`, data); // หรือเปลี่ยน URL เป็นของ backend จริง
    return response.data;
};
