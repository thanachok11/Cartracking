import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectDB from './utils/database';

import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import driverRoutes from './routes/driverRoutes';
import containers from './routes/containerRouters';
import trackcontainers from './routes/trackcontainersRouters';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

connectDB();

const corsOptions = {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ให้ตอบ preflight ทุก route

app.use(session({
    name: 'PHPSESSID',
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // ตั้งเป็น true ถ้าใช้ HTTPS
        sameSite: 'none',   // ต้องใช้ none เพื่อ cross-origin cookie
    }
}));

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', vehicleRoutes);
app.use('/api', driverRoutes);
app.use('/api', containers);
app.use('/api', trackcontainers);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
