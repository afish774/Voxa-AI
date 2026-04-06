import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs'; // 👈 NEW: Import the File System module
import connectDB from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';

// 1. Load environment variables FIRST
dotenv.config();

// 👈 NEW: MAGIC TRICK! 
// If the secure environment variable exists, generate the JSON file on the fly so Google TTS can read it!
if (process.env.GOOGLE_CREDENTIALS) {
    fs.writeFileSync('google-credentials.json', process.env.GOOGLE_CREDENTIALS);
    console.log('🔐 Google Credentials file securely generated from Environment Variables.');
}

const app = express();

// 2. Standard Middleware
const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Health Check Route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Voxa API is awake and listening.' });
});

// 4. API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// 5. Connect to Database AND THEN Start Server
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