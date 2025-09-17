import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectDB from './utils/database';
import MongoStore from 'connect-mongo';
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import driverRoutes from './routes/driverRoutes';
import containers from './routes/containerRouters';
import useRouter from './routes/userRoutes';
import dataTodayRoutes from "./routes/dataTodayRoutes";
import truckHeadRoutes from './routes/truckHeadRoutes';
import truckTailRoutes from './routes/truckTailRoutes';
import allowedPagesRoutes from "./routes/allowedPagesRoutes";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ✅ เชื่อมต่อ MongoDB
connectDB();

// ✅ CORS (เพิ่ม * ชั่วคราว เผื่อ Railway health check)
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://cartracking.up.railway.app',
        'https://porchoengroup.com',
        'https://www.porchoengroup.com',
        '*'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ให้ตอบ preflight ทุก route

// ✅ Session config (flexible ตาม environment)
app.use(
    session({
        name: 'PHPSESSID',
        secret: process.env.SESSION_SECRET || 'my-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl:
                process.env.MONGODB_URI ||
                'mongodb://localhost:27017/cartracking',
            collectionName: 'sessions',
        }),
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // ใช้ secure เมื่อ production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24, // 1 วัน
        },
    })
);

app.use(express.json());
app.use(mongoSanitize());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', useRouter);
app.use('/api', vehicleRoutes);
app.use('/api', driverRoutes);
app.use('/api', containers);
app.use("/api/datatoday", dataTodayRoutes);
app.use('/api', truckHeadRoutes);
app.use('/api', truckTailRoutes);
app.use("/api/allowed-pages", allowedPagesRoutes);

// ✅ Root route (Railway ใช้ health check ตรงนี้)
app.get('/', (req, res) => {
    res.status(200).send('🚀 API is running...');
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
