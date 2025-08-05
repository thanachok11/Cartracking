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

//  CORS middleware
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

// Session middleware (ไม่มี methods และ allowedHeaders)
app.use(session({
    name: 'PHPSESSID',
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // ตั้งเป็น true ถ้าใช้ HTTPS
        sameSite: 'lax',
    }
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', vehicleRoutes);
app.use('/api', driverRoutes);
app.use('/api', containers);
app.use('/api', trackcontainers);

// Default route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
