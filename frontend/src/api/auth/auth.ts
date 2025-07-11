// services/auth.ts
import axios from 'axios';

// กำหนด URL ของ API

// ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้ใหม่
export const registerUser = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/register`, {
            email,
            password,
            firstName,
            lastName
        });

        return response.data;  // ส่งข้อมูลที่ได้รับจาก API
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

// ฟังก์ชันสำหรับการล็อกอินผู้ใช้
export const loginUser = async (email: string, password: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, {
            email,
            password
        });

        return response.data;  // ส่งข้อมูลที่ได้รับจาก API
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
};

// auth.ts
