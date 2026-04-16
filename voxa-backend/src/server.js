import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import sportsRoutes from './routes/sportsRoutes.js';

dotenv.config();

// Initialize MongoDB
connectDB();

const app = express();

// 🛡️ THE BULLETPROOF CORS FIX
app.use(cors({
    origin: function (origin, callback) {
        callback(null, origin || true);
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

// Basic health check route
app.get('/', (req, res) => {
    res.send('Voxa AI Backend is running securely with sessionless OAuth.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Voxa Engine live on port ${PORT}`);
});