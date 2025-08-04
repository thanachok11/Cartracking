import { Request, Response } from "express";
import axios from "axios";
import { CookieJar } from "tough-cookie";

// import { wrapper } from "axios-cookiejar-support"; // จะ error ใน commonjs

export const trackContainers = async (req: Request, res: Response): Promise<void> => {
    try {
        const cookieHeader = req.headers.cookie;

        if (!cookieHeader) {
            res.status(401).json({ success: false, error: "Missing cookie in request headers" });
            return;
        }

        const jar = new CookieJar();

        // ใช้ dynamic import สำหรับ ES Module
        const { wrapper } = await import("axios-cookiejar-support");

        const client = wrapper(axios.create({ jar }));

        await jar.setCookie(cookieHeader, "https://ucontainers.com.cn");

        const response = await client.post("https://ucontainers.com.cn/api/track_api.php", {
            token: "af49be057f80c59e5da3f9a8f17c70c6",
            api_name: "get_containers",
        });

        res.status(200).json({ success: true, data: response.data });
    } catch (err: any) {
        console.error("❌ Failed to fetch containers:", err.message || err);
        res.status(500).json({ success: false, error: "Failed to fetch containers" });
    }
};
