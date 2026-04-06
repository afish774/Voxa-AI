import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';

// 1. Load environment variables FIRST
dotenv.config();

const app = express();

// 2. Standard Middleware (UPDATED FOR VERCEL DEPLOYMENT)
app.use(cors({
    origin: [
        "http://localhost:5173",          // Local frontend testing
        "https://voxa-ai.vercel.app",     // Live Vercel frontend
        "https://voxa-ai-git-main.vercel.app" // Vercel preview branches
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // Crucial for JWT authentication
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Health Check Route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Voxa API is awake and listening.' });
});

// 4. API Routes
app.use('/api/chat', chatRoutes); // Talks to Gemini
app.use('/api/auth', authRoutes); // Handles Login/Register

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