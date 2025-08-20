import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectDB from './utils/database';
import MongoStore from 'connect-mongo';

import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import driverRoutes from './routes/driverRoutes';
import containers from './routes/containerRouters';
import trackcontainers from './routes/trackcontainersRouters';
import useRouter from './routes/userRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// เชื่อมต่อ MongoDB
connectDB();

// CORS options (Frontend URL)
const corsOptions = {
    origin: [
        'http://localhost:3000',              // สำหรับ dev
        'https://cartracking.up.railway.app', // สำหรับ production
        'https://porchoengroup.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ให้ตอบ preflight ทุก route

// Session config (ใช้ MongoDB store แทน MemoryStore)
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
            secure: process.env.NODE_ENV === 'production', // true เมื่อรันบน Railway (HTTPS)
            sameSite: 'none', // ต้องใช้ none เพื่อ cross-origin cookie
            maxAge: 1000 * 60 * 60 * 24, // 1 วัน
        },
    })
);

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', useRouter);
app.use('/api', vehicleRoutes);
app.use('/api', driverRoutes);
app.use('/api', containers);
app.use('/api', trackcontainers);

// Root route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
