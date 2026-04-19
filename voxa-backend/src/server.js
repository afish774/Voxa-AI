import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';
import learnRoutes from './routes/learnRoutes.js'; // 🛠️ SURGICAL FIX: Mount the knowledge ingestion API

dotenv.config();

// Initialize MongoDB
connectDB();

const app = express();

// 🛠️ SURGICAL FIX: [V-03] Replaced open wildcard CORS with explicit origin whitelist
// Only the Vercel production frontend and localhost dev server are allowed
const ALLOWED_ORIGINS = [
    "https://voxa-ai-git-main-afishmv-7650s-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server requests (no origin) and whitelisted origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🛡️ CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🚀 INITIALIZE PASSPORT (Sessions Completely Removed!)
app.use(passport.initialize());

// 🛣️ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/learn', learnRoutes); // 🛠️ SURGICAL FIX: Mount the knowledge ingestion API

// Basic health check route
app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely with sessionless OAuth.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});