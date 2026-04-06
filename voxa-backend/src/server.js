import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import connectDB from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';

// 1. Load environment variables FIRST
dotenv.config();

// 2. Generate Google Credentials file securely from Environment Variables
if (process.env.GOOGLE_CREDENTIALS) {
    fs.writeFileSync('google-credentials.json', process.env.GOOGLE_CREDENTIALS);
    console.log('🔐 Google Credentials file securely generated from Environment Variables.');
}

const app = express();

// 3. Bulletproof CORS Policy for Vercel
const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true); // Accepts any incoming Vercel URL
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // Crucial for JWT tokens
    credentials: true
};

app.use(cors(corsOptions));

// 4. Express 5 Preflight Bypass Hack (Fixes the wildcard crash)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 5. Health Check Route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Voxa API is awake and listening.' });
});

// 6. API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// 7. Connect to Database AND THEN Start Server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Voxa Engine live at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Critical: Failed to start Voxa Engine due to DB error.");
    }
};

startServer();