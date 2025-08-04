import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { Request, Response } from 'express';

let sessionCookie = '';

export const loginContainers = async (req: Request, res: Response): Promise<void> => {
    try {
        const username = process.env.CT_USERNAME;
        const password = process.env.CT_PASSWORD;

        if (!username || !password) {
            res.status(400).json({ success: false, message: 'Missing .env credentials' });
            return;
        }

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await axios.post('https://ucontainers.com.cn/api/auth.php', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            sessionCookie = setCookie[0];
            console.log('Received cookie from server:', sessionCookie);

            // ส่ง cookie กลับ browser ผ่าน Set-Cookie header
            res.setHeader('Set-Cookie', sessionCookie + '; HttpOnly; Path=/; SameSite=Lax');

            res.json({ success: true, message: 'Login success' });
            return;
        } else {
            console.warn('No set-cookie header received from server');
            res.status(500).json({ success: false, message: 'No cookie received' });
            return;
        }
    } catch (err: any) {
        console.error('Login failed:', err);
        res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
};

// ฟังก์ชัน renew cookie
export const renewCookie = async (req: Request, res: Response): Promise<void> => {
    try {
        // เรียก loginContainers ใหม่เพื่อได้ cookie ใหม่
        await loginContainers(req, res);
    } catch (err: any) {
        res.status(500).json({ success: false, message: 'Renew cookie failed', error: err.message });
    }
};

export const getSessionCookie = () => sessionCookie;
