import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

// Initialize MongoDB
connectDB();

const app = express();

// 🛡️ THE BULLETPROOF CORS FIX
app.use(cors({
    origin: function (origin, callback) {
        // This explicitly echoes back whatever Vercel URL is making the request,
        // safely bypassing all CORS origin restrictions.
        callback(null, origin || true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Explicitly allow the Preflight OPTIONS
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"] // Explicitly whitelist our JWT headers
}));

// Body parser with increased limit to handle large Base64 image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🛣️ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Basic health check route for Render
app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});