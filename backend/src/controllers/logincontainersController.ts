import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { Request, Response } from 'express';

let sessionCookie = '';  // เก็บ session cookie
let containerToken = ''; // เก็บ token

// ฟังก์ชัน core สำหรับ login containers และดึง cookie + token
const performContainerLogin = async (): Promise<{ cookie: string; token: string }> => {
    const username = process.env.CT_USERNAME;
    const password = process.env.CT_PASSWORD;

    if (!username || !password) {
        throw new Error('Missing .env credentials');
    }

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post('https://ucontainers.com.cn/api/auth.php', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // 1) ดึง cookie
    const setCookie = response.headers['set-cookie'];
    if (!setCookie || setCookie.length === 0) {
        throw new Error('No set-cookie header received');
    }
    sessionCookie = setCookie[0];

    // 2) ดึง token
    if (!response.data || !response.data.token) {
        throw new Error('No token received from server');
    }
    containerToken = response.data.token;

    return { cookie: sessionCookie, token: containerToken };
};

// API: Login containers และส่ง cookie + token กลับ browser
export const loginContainers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cookie, token } = await performContainerLogin();
        console.log('Received cookie:', cookie);
        console.log('Received token:', token);

        // ตั้งค่า cookie กลับไปให้ browser under a distinct name to avoid overwriting app session
        // cookie (external) often includes its own name (e.g. PHPSESSID). Extract value and set under
        // our own cookie name so we don't overwrite the server's session cookie.
        try {
            const raw = Array.isArray(cookie) ? cookie[0] : cookie; // defensive
            const pair = raw.split(';')[0]; // "NAME=VALUE"
            const value = pair.split('=')[1] || '';
            // use res.cookie to avoid replacing existing session cookie name (PHPSESSID)
            res.cookie('ucontainers_session', value, {
                httpOnly: true,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
        } catch (e) {
            // fallback to sending raw header if parsing fails
            res.setHeader('Set-Cookie', cookie + '; HttpOnly; Path=/; SameSite=Lax');
        }

        // ส่ง token กลับใน response
        res.json({ success: true, message: 'Login success', token });
    } catch (err: any) {
        console.error('Login failed:', err);
        res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
};

// export ตัวแปรไว้ใช้ใน API อื่น
export const getContainerToken = () => containerToken;


// API: Renew cookie (ขอ cookie ใหม่) และส่งกลับ browser
export const renewCookie = async (req: Request, res: Response): Promise<void> => {
    try {
        const cookie = await performContainerLogin();
        console.log('🔄 Cookie renewed:', cookie);

        try {
            const raw = Array.isArray(cookie) ? cookie[0] : cookie;
            const pair = raw.split(';')[0];
            const value = pair.split('=')[1] || '';
            res.cookie('ucontainers_session', value, {
                httpOnly: true,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
        } catch (e) {
            res.setHeader('Set-Cookie', cookie + '; HttpOnly; Path=/; SameSite=Lax');
        }
        res.json({ success: true, message: 'Cookie renewed' });
    } catch (err: any) {
        console.error('Renew failed:', err);
        res.status(500).json({ success: false, message: 'Renew cookie failed', error: err.message });
    }
};

// ฟังก์ชันให้ดึง session cookie ปัจจุบันใน backend
export const getSessionCookie = (): string => sessionCookie;
